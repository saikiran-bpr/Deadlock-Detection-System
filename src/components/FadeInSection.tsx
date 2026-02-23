"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface FadeInSectionProps {
    children: ReactNode;
    delay?: string;
}

export default function FadeInSection({ children, delay = "0s" }: FadeInSectionProps) {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // Use forEach since there is only one element observed here
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        // Optional: Unobserve after it becomes visible to only animate once
                        if (domRef.current) {
                            observer.unobserve(domRef.current);
                        }
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        if (domRef.current) {
            observer.observe(domRef.current);
        }

        return () => {
            if (domRef.current) observer.unobserve(domRef.current);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-700 ease-out fill-mode-both ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
            style={{ transitionDelay: delay }}
        >
            {children}
        </div>
    );
}
