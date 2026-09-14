"use client";

import { ArrowUpRight } from "lucide-react";

type RotatingCircleProps = {
    text?: string;
    size?: number;
    textSize?: number;
    duration?: number;
    orientation?: "tangent" | "radial"; // tangencial al círculo o hacia el centro
    onClick?: () => void;
};

export default function RotatingCircle({
    text = "inicia tu viaje ✦ ",
    size = 180,
    textSize = 14,
    duration = 12,
    onClick,
}: RotatingCircleProps) {
    const radius = size / 2;
    const characters = text.split("");

    return (
        <button
            onClick={onClick}
            className="relative flex items-center justify-center rounded-full bg-[#12051f] border border-white/10 overflow-hidden ml-260 -mt-20  animate-[spin_12s_linear_infinite_reverse]"
            style={{
                width: size,
                height: size,
            }}
        >
            {/* Texto giratorio */}
            <div
                className="absolute inset-0 animate-spin"
                style={{
                    animationDuration: `${duration}s`,
                }}
            >
                {characters.map((char, i) => {
                    const angle = (360 / characters.length) * i;

                    return (
                        <span
                            key={i}
                            className="absolute left-1/2 top-1/2 text-white tracking-[2px]"
                            style={{
                                fontSize: textSize,
                                transform: `
                  rotate(${angle}deg)
                  translateY(-${radius - 30}px)
                  rotate(180deg)
                `,
                                transformOrigin: "0 0",
                            }}
                        >
                            {char}
                        </span>
                    );
                })}
            </div>

            {/* Centro */}
            <div className="flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md">
                <div
                    className="flex items-center justify-center rounded-full bg-white/10"
                    style={{
                        width: size * 0.45,
                        height: size * 0.45,
                    }}
                >
                    <ArrowUpRight
                        className="text-white"
                        size={size * 0.18}
                        strokeWidth={2.5}
                    />
                </div>
            </div>
        </button>
    );
}
