"use client";

import React from "react";
import Split from "react-split";

import ProblemDescription from "@/components/Workspace/ProblemDescription/ProblemDescription";
import Playground from "@/components/Workspace/Playground/Playground";

import { Problem } from "@/mockProblems/problem";

type WorkspaceProps = {
  problem: Problem;
};

const Workspace: React.FC<WorkspaceProps> = ({ problem }) => {
  return (
    <Split
      className="split"
      direction="horizontal"
      sizes={[50, 50]}
      minSize={0}
      gutterSize={8}
    >
      {/* LEFT - Problem Description */}
      <div className="overflow-auto">
        <ProblemDescription problem={problem} />
      </div>

      {/* RIGHT - Playground */}
      <div className="bg-dark-layer-2 overflow-hidden">
        <Playground problem={problem} />
      </div>
    </Split>
  );
};

export default Workspace;