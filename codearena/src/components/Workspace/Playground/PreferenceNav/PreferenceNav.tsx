"use client";

import { useEffect, useState } from "react";
import {
  AiOutlineFullscreen,
  AiOutlineFullscreenExit,
  AiOutlineSetting,
} from "react-icons/ai";

type PreferenceNavProps = {
  onSettingsClick?: () => void;
};

const PreferenceNav = ({
  onSettingsClick,
}: PreferenceNavProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const handleFullScreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-11 w-full items-center justify-between bg-dark-layer-2">

      {/* LEFT */}
      <div className="flex items-center">
        <button
          type="button"
          className="ml-2 rounded bg-dark-fill-3 px-3 py-1.5 text-sm text-white"
        >
          JavaScript
        </button>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 mr-2">

        <button
          type="button"
          onClick={onSettingsClick}
          className="flex h-8 w-8 items-center justify-center rounded bg-dark-fill-3 text-white hover:bg-gray-600"
          title="Settings"
        >
          <AiOutlineSetting size={20} />
        </button>

        <button
          type="button"
          onClick={handleFullScreen}
          className="flex h-8 w-8 items-center justify-center rounded bg-dark-fill-3 text-white hover:bg-gray-600"
          title="Full Screen"
        >
          {isFullScreen ? (
            <AiOutlineFullscreenExit size={20} />
          ) : (
            <AiOutlineFullscreen size={20} />
          )}
        </button>

      </div>
    </div>
  );
};

export default PreferenceNav;