"use client";

import { useRef } from "react";
import useHorizontalScroll from "../hooks/useHorizontalScroll";
import ChunkyImage from "@/app/components/ChunkyImage";

const panels = [
  {
    id:1,
    title: "Beyond\nProjects",
    text:
      "We don't just build projects. We build curious minds capable of solving real-world problems.",
    image: "/aboutImages/about1.jpg",
  },
  {
    id:2,
    title: "Technology\nMeets Vision",
    text:
      "Artificial Intelligence, Space Technology, Robotics and Software Engineering working together.",
    image: "/aboutImages/about2.jpg",
  },
  {
    id:3,
    title: "Community\nFirst",
    text:
      "Hackathons, workshops, mentorship and collaboration shape tomorrow's innovators.",
    image: "/aboutImages/about3.jpg",
  },
  {
    id:4,
    title: "Create\nThe Future",
    text:
      "The future belongs to those who build it. Dhanak exists to help students become one of them.",
    image: "/aboutImages/about4.jpg",
  },
];

export default function HorizontalStory() {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);

  useHorizontalScroll(sectionRef, containerRef);

  return (
    <section className="horizontal-section" ref={sectionRef}>
      <div className="horizontal-container" ref={containerRef}>
        {panels.map((panel) => (
          <div className="story-panel" key={panel.id}>
            <div className="story-image-wrapper">
              <ChunkyImage
                className="story-image"
                src={panel.image}
                alt={panel.title}
                targetWidth={1200}
                loading="lazy"
              />
            </div>

            <div className="story-content">

              <h1>
                {panel.title.split("\n").map((line, index) => (
                  <div key={index} className="line-wrapper">
                    <span className="line-inner">{line}</span>
                  </div>
                ))}
              </h1>

              <p>{panel.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="horizontal-progress-bar">
        <div className="horizontal-progress-fill" />
      </div>
    </section>
  );
}