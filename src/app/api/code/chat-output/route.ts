import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getFirebaseSession } from "@/lib/firebaseSession";
import { chatOutputValidation } from "@/schemas/chatOutputSchema";
import { consumeExecutionRateLimit } from "@/lib/executionGuard";
import {
    generateGeminiChatResponse,
    describeGeminiError,
    getGeminiApiKey,
    GEMINI_CHAT_MODEL,
} from "@/lib/geminiChat";
import { parseBoundedJson } from "@/schemas/codeExecutionSchema";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 100 * 1024;

export async function POST(req: NextRequest) {
    const session = await getFirebaseSession(req);
    if (!session) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized",
        }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await parseBoundedJson(req, MAX_REQUEST_BYTES);
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: error instanceof RangeError
                    ? error.message
                    : "Request body must be valid JSON.",
            },
            { status: error instanceof RangeError ? 413 : 400 },
        );
    }

    const parsedBody = chatOutputValidation.safeParse(body);
    if (!parsedBody.success) {
        return NextResponse.json({
            success: false,
            message: parsedBody.error.issues[0]?.message ?? "Invalid chat request.",
        }, { status: 400 });
    }

    if (!consumeExecutionRateLimit(`chat:${session.uid}`, 20)) {
        return NextResponse.json({
                success: false,
                message: "AI chat rate limit reached. Please wait a minute before sending another message.",
            }, { status: 429 });
    }

    const apiKey = getGeminiApiKey(process.env.GEMINI_API_KEY);
    if (!apiKey) {
        return NextResponse.json({
                success: false,
                message: "AI chat is not configured. Set GEMINI_API_KEY in the server environment and restart the app.",
            }, { status: 503 });
    }

    try {
        const { sourceCode, inputMessage } = parsedBody.data;
        const ai = new GoogleGenAI({ apiKey });
        const text = await generateGeminiChatResponse(
            inputMessage,
            sourceCode,
            async (prompt) => {
                const result = await ai.interactions.create({
                    model: GEMINI_CHAT_MODEL,
                    input: prompt,
                    store: false,
                });
                return result.output_text;
            },
        );

        return NextResponse.json({
            success: true,
            message: "Generated output successfully",
            output: text,
        }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === "Gemini returned an empty response.") {
            console.error("Gemini chat request returned an empty response.");
            return NextResponse.json({
                success: false,
                message: "The AI assistant returned an empty response. Please try again.",
            }, { status: 502 });
        }
        const diagnostic = describeGeminiError(
            error,
            apiKey,
            process.env.NODE_ENV === "development",
        );
        console.error("Gemini chat request failed:", {
            name: error instanceof Error ? error.name : "UnknownError",
            status: diagnostic.status,
            ...(diagnostic.detail ? { detail: diagnostic.detail } : {}),
        });
        return NextResponse.json({
            success: false,
            message: diagnostic.message,
        }, { status: 502 });
    }
}