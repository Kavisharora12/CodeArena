"use client";

import React, { useState } from "react";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";

import PreferenceNav from "./PreferenceNav/PreferenceNav";
import EditorFooter from "./EditorFooter";
import { Problem } from "@/mockProblems/problem";
import { toast } from "react-toastify";

type PlaygroundProps = {
  problem: Problem;
};

export interface ISettings {
  fontSize: string;
  settingsModalIsOpen: boolean;
  dropdownIsOpen: boolean;
}

const Playground: React.FC<PlaygroundProps> = ({ problem }) => {
  const [userCode, setUserCode] = useState<string>(
    `function solution() {\n  // Write your solution here\n}`
  );

  const [settings, setSettings] = useState<ISettings>({
    fontSize: "16px",
    settingsModalIsOpen: false,
    dropdownIsOpen: false,
  });

  const [activeTestCaseId, setActiveTestCaseId] = useState(0);

  const testCases = [
    {
      input: "Example input",
      output: "Example output",
    },
    {
      input: "Example input 2",
      output: "Example output 2",
    },
  ];

  const handleSubmit = () => {
    toast.info("Code execution will be added next.", {
      position: "top-center",
      autoClose: 2000,
      theme: "dark",
    });
  };

  const onChange = (value: string) => {
    setUserCode(value);
  };

  return (
    <div className="flex flex-col bg-dark-layer-1 relative overflow-hidden h-full">

      {/* Preference Navigation */}
      <PreferenceNav
        onSettingsClick={() =>
          setSettings({
            ...settings,
            settingsModalIsOpen: true,
          })
        }
      />

      {/* Code Editor + Test Cases */}
      <Split
        className="h-[calc(100vh-94px)]"
        direction="vertical"
        sizes={[60, 40]}
        minSize={60}
      >

        {/* Code Editor */}
        <div className="w-full overflow-auto">
          <CodeMirror
            value={userCode}
            theme={vscodeDark}
            onChange={onChange}
            extensions={[javascript()]}
            style={{
              fontSize: settings.fontSize,
            }}
          />
        </div>

        {/* Test Cases */}
        <div className="w-full px-5 overflow-auto">

          <div className="flex h-10 items-center space-x-6">
            <div className="relative flex h-full flex-col justify-center cursor-pointer">
              <div className="text-sm font-medium leading-5 text-white">
                Testcases
              </div>

              <hr className="absolute bottom-0 h-0.5 w-full rounded-full border-none bg-white" />
            </div>
          </div>

          {/* Test case buttons */}
    {/* Test case buttons */}
<div className="flex">
  {problem.examples.map((example, index) => (
    <div
      key={example.id}
      className="mr-2 mt-2"
      onClick={() => setActiveTestCaseId(index)}
    >
      <div
        className={`font-medium inline-flex bg-dark-fill-3 hover:bg-dark-fill-2 rounded-lg px-4 py-1 cursor-pointer whitespace-nowrap ${
          activeTestCaseId === index
            ? "text-white"
            : "text-gray-500"
        }`}
      >
        Case {index + 1}
      </div>
    </div>
  ))}
</div>

{/* Input / Output */}
<div className="font-semibold my-4">
  <p className="text-sm font-medium mt-4 text-white">
    Input:
  </p>

  <div className="w-full rounded-lg px-3 py-[10px] bg-dark-fill-3 text-white mt-2">
    {problem.examples[activeTestCaseId].inputText}
  </div>

  <p className="text-sm font-medium mt-4 text-white">
    Output:
  </p>

  <div className="w-full rounded-lg px-3 py-[10px] bg-dark-fill-3 text-white mt-2">
    {problem.examples[activeTestCaseId].outputText}
  </div>
</div>

        </div>
      </Split>

      {/* Bottom Footer */}
      <EditorFooter handleSubmit={handleSubmit} />

    </div>
  );
};

export default Playground;