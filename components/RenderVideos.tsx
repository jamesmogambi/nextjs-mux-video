"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";

const RenderVideos = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const res = await fetch("/api/mux/list");
      const data = await res.json();
      setVideos(data.data || []);
      console.log("videos", data.data);
    };
    fetchVideos();
  }, []);

  if (videos.length === 0) {
    return (
      <div>
        <div className="flex flex-col md:flex-row items-center py-6 gap-6">
          <Skeleton className="h-[250px] basis-full md:basis-1/3 bg-purple-darker" />
          <Skeleton className="h-[250px] basis-full md:basis-1/3  bg-purple-darker" />
          <Skeleton className="h-[250px] basis-full md:basis-1/3  bg-purple-darker" />
        </div>
        <Skeleton className="h-[250px] w-1/3  bg-purple-darker" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6 py-6">
      {videos.map((video: any) =>
        video.playback_ids?.[0] ? (
          <Link
            href={`/play-video/${video.playback_ids?.[0].id}`}
            key={video.id}
            className=""
          >
            <Image
              //   src={video.thumbnailUrl}
              src={`https://image.mux.com/${video.playback_ids?.[0].id}/thumbnail.jpg?time=5`}
              alt={video.title}
              className="object-cover rounded"
              height={300}
              width={500}
            />
            <h3 className="mt-2 text-center">{video.title}</h3>
          </Link>
        ) : null
      )}
    </div>
  );
};

export default RenderVideos;
