---
title: "Next.js + MUX: Real-Time Video Streaming Integration Guide"
seoTitle: "Build a Scalable Video Platform with MUX Video API and Next.js"
seoDescription: "How to Build a Robust Video Flow with MUX & Next.js (Uploads, Playback, Webhooks)"
datePublished: Sun Jul 27 2025 17:33:44 GMT+0000 (Coordinated Universal Time)
cuid: cmdlykan3000202js5axfc656
slug: real-time-video-streaming-and-webhook-automation-using-mux-api-and-nextjs
cover: https://cdn.hashnode.com/res/hashnode/image/stock/unsplash/KieCLNzKoBo/upload/b7d6d0dceefdc26ffe8efcc73f4437fc.jpeg
tags: fullstack, javascript, reactjs, typescript, webhooks, frontend-development, serverless, developer-tools, nextjs, mux, video-streaming, backend-development, webhook, tailwind-css, api-integration

---

## 🛠️ The Hidden Complexity of Video Streaming with Amazon S3

Building a scalable video platform isn’t just about storing files—it’s about delivering content smoothly, handling edge cases, and syncing backend workflows reliably. Initially, Amazon S3 seems like a solid option for video uploads. It offers secure, scalable object storage and integrates easily with a Next.js backend.

However, the moment you need to support:

* 🌀 Transcoding for different resolutions and bandwidths
    
* ⏯️ Seamless playback with adaptive streaming
    
* 🧩 Real-time sync with backend systems (e.g., asset status)
    
* 🔁 Automatic retry handling for webhook delivery failures
    

…it becomes clear that S3 alone can’t deliver the full experience without layering on additional services like AWS Lambda, Elastic Transcoder, CloudFront, and your own webhook handling logic. This introduces complexity, cost, and reliability risks, especially as usage scales.

## ✨ Why I Choose MUX VIDEO API Instead

Mux streamlines everything S3 doesn’t natively provide:

* ✅ **Built-in Transcoding** for adaptive bitrate streaming
    
* 🚀 **Simple Direct Upload API** that plays well with Next.js/React
    
* 🔄 **Robust Webhook Support** for asset lifecycle events (e.g., `video.asset.ready`)
    
* 🎛️ **Optimized Video Delivery** via Mux’s global infrastructure
    
* 📦 **Less Glue Code** — no need to stitch together multiple AWS services
    

For video platforms where user experience, developer speed, and reliability matter, Mux offers an elegant, all-in-one solution that reduces architecture sprawl.

## 🧰 Prerequisites

Before diving into building a seamless video workflow with MUX Video API and Next.js, make sure you have the following tools and knowledge ready:

⚙️ Technical Requirements

* **Node.js (v18 or later)** installed on your machine
    
* **Next.js (v13 or newer)** project set up (preferably with the App Router)
    
* **React.js** knowledge
    
* Knowledge of how to work with **environment variables** in Node.js
    

## ⚙️ Requirements:

This guide walks through **uploading videos directly to Mux using MuxUploader component** and then rendering them with **MuxPlayer** once they're processed. The flow includes:

* 📤 Uploading videos with MuxUploader (direct-to-Mux)
    
* ⚙️ Mux setup and API endpoints
    
* 📡 Handling Mux webhooks
    
* 🎥 Playing back processed videos
    

This setup ensures **secure, scalable** uploads without needing your own file server.

Let’s break this into the following clean stages that will guide you from setup to playback.

*To follow along with the implementation, you can clone the example repository from GitHub below:*

```bash
git clone https://github.com/jamesmogambi/nextjs-mux-video.git
```

### 1.🔑 Initialize Mux in Your Next.js App

* Sign up on [Mux an](https://mux.com/)d grab your `MUX_TOKEN_ID` and `MUX_SECRET`.
    
* Store them in your `.env` file
    
    ```bash
    // .env
    MUX_TOKEN_ID=your-token-id
    MUX_TOKEN_SECRET=your-secret
    ```
    
    To use Mux’s APIs, you need an access token made up of a Token ID and Secret, which together authorize secure video-related requests. You can generate this token by logging into [dashboard.mux.com](http://dashboard.mux.com)[, navigating to **S**](https://dashboard.mux.com/)**ettings &gt; API Access Tokens**, and creating a new token with **read and write permissions for Mux Video**. Be sure to save the credentials—especially the Secret, which is only visible once—and store them in your `.env` file like this: `MUX_TOKEN_ID=your-token-id` and `MUX_SECRET=your-secret`. Keep these private to protect your app.
    
    Make sure to select the Mux-Video and Mux-Data permissions.
    
    ![](https://cdn.hashnode.com/res/hashnode/image/upload/v1753628168079/82a72cae-1093-486f-8863-22a79cd6b336.jpeg align="center")
    
* Install the official SDK with the following helpers
    
    ```bash
    npm install @mux/mux-node  @mux/mux-uploader-react@latest  @mux/mux-player-react@latest
    ```
    
    * `@mux/mux-node`: The official Mux SDK for Node.js — lets your backend create uploads, access assets, set playback permissions, and interact with Mux’s APIs.
        
    * `@mux/mux-uploader-react`: A React component that enables direct-to-Mux video uploads from the browser. It handles file selection, progress, and streaming securely from your frontend.
        
    * `@mux/mux-player-react`: A customizable video player component for React that supports adaptive streaming, metadata, and responsive styling — ideal for playback in your app.
        
* Configure a Mux client helper
    
    ```typescript
    // lib/mux.ts
    import { Mux } from "@mux/mux-node";
    
    export const muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
    ```
    

### 2\. 🌐 Generate a Direct Upload URL (API Route)

Create an endpoint to generate upload URLs:

```typescript
// app/api/mux/create-upload-url/route.ts  
import { muxClient } from "@/lib/mux";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const upload = await muxClient.video.uploads.create({
      new_asset_settings: {
        playback_policies: ["public"], // ✅ Use array instead of string
      },
      cors_origin: "*",
    });

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error("Mux upload creation failed:", error);
    return NextResponse.json(
      { error: "Upload creation failed", details: String(error) },
      { status: 500 }
    );
  }
}
```

This API route powers direct-to-Mux video uploads from your frontend. When a `POST` request hits `/api/mux/create-upload-url`, the backend spins up a new upload session using `muxClient`. It sets public playback access (so videos are viewable via link) and allows cross-origin uploads with `cors_origin: "*"`—perfect for flexible deployments. In return, the endpoint sends back an `uploadUrl` and `uploadId`, which your UI can use to push video files straight to Mux. It’s efficient, scalable, and keeps heavy file transfers off your server. Errors are caught gracefully, so debugging stays transparent.

### 3\. 📤 Upload Videos Using MuxUploader Component

Use `MuxUploader` component in your frontend to handle direct uploads.

This React component is your frontend gateway to Mux. It uses `MuxUploader`, an official Mux UI component, to let users upload videos directly from the browser — no backend file handling required. When the uploader initializes, it hits your `/api/mux/create-upload-url` endpoint to get a secure upload link. If that fails, you get a toast error with helpful feedback. The uploader handles everything else: file selection, progress display, and direct upload to Mux’s infrastructure. The whole thing lives inside a clean form container, making integration a breeze. All this gives you fast, reliable uploads with minimal glue code.

```typescript
//components/VideoUploadForm.tsx
"use client";
import React, { useState } from "react";
import MuxUploader from "@mux/mux-uploader-react";

import { toast } from "sonner";

const VideoUploadForm = () => {
  return (
    <div className="space-y-6 w-full mb-9">
      <div className="mx-auto max-w-1/2 space-y-8">
        <h2 className="">Upload Video to Mux</h2>

        <MuxUploader
          endpoint={async () => {
            const response = await fetch("/api/mux/create-upload-url", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
            const data = await response.json();
            if (!response.ok) {
              toast.error("Failed to create upload URL", {
                description: data.error || "Unknown error",
              });
              throw new Error(data.error || "Unknown error");
            }

            return data.uploadUrl;
          }}
          style={{ width: "100%", maxWidth: "500px" }}
        />
      </div>
    </div>
  );
};

export default VideoUploadForm;
```

You’ll get automatic progress tracking and UI feedback out-of-the-box. You can customize the UI of `MuxUploader` component, add metadata, control feedback and extend its interactions .

### 4\. 📡 Handle Webhooks for `video.asset.ready` event

Once Mux processes the upload, it sends a webhook—here’s how to catch it:

To respond to video lifecycle events (like when a video is ready for playback), Mux lets you register a webhook URL that it will call automatically. Here's how to integrate it into your setup:

1. 🔧 **Step 1: Expose Your Endpoint**
    
    If you're running your app locally, use [Ngrok to e](https://ngrok.com/)xpose your webhook route publicly:
    

```bash
npx ngrok http 3000
```

Copy the public URL Ngrok gives you — e.g., [`https://abc123.ngrok.io`](https://abc123.ngrok.io)

This will point to your Next.js webhook route:  
[`https://abc123.ngrok.io/api/webhooks/mux`](https://abc123.ngrok.io/api/webhooks/mux)

2\. **🧩 Step 2: Add Webhook in the Mux Dashboard**

* Go to [dashboard.mux.com](http://dashboard.mux.com) → **Settings** → **Webhooks**
    
* Click **“Add Webhook”**
    
* Paste your Ngrok URL, e.g., [`https://abc123.ngrok.io/api/webhooks/mux`](https://abc123.ngrok.io/api/webhooks/mux)
    
* Mux will generate a **signing secret** — copy it into your `.env` as `MUX_SIGNING_SECRET`
    
    ![](https://cdn.hashnode.com/res/hashnode/image/upload/v1753627931836/fe1b855b-3a96-4558-a583-8d93a1d3cea0.jpeg align="center")
    
    Your finalized `.env` file should reflect the following structure:
    
    ```bash
    
    MUX_TOKEN_ID=your-token-id
    MUX_TOKEN_SECRET=your-secret
    MUX_SIGNING_SECRET=your-signing-secret
    ```
    
* Create the following webhook that will be responsible for handling events:
    

```typescript

//@api/mux/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const muxSigningSecret = process.env.MUX_SIGNING_SECRET!;

export async function POST(req: NextRequest) {
  try {
    // await connectToDB();

    const signatureHeader = req.headers.get("mux-signature");
    if (!signatureHeader) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const [timestampPart, signaturePart] = signatureHeader.split(",");
    const timestamp = timestampPart.replace("t=", "");
    const receivedSignature = signaturePart.replace("v1=", "");

    const rawBody = await req.text(); // ✨ Accurate raw body
    const payload = `${timestamp}.${rawBody}`;

    const expectedSignature = crypto
      .createHmac("sha256", muxSigningSecret)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== receivedSignature) {
      console.warn("Signature mismatch");
      console.log("Expected:", expectedSignature);
      console.log("Received:", receivedSignature);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const muxEvent = JSON.parse(rawBody);
    const asset = muxEvent.data;
   
   
    if (muxEvent.type !== "video.asset.ready") {
      return NextResponse.json({ message: "No actionable event." });
    }
    console.log("Video uploaded successfully!");
    return NextResponse.json({
      message: "Video uploaded successfully!",
    });
  } catch (error: any) {
    console.error("Mux webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

This route listens for **Mux webhook events** like `video.asset.ready`, which fire after a video finishes processing. To keep things secure, Mux includes a signature in the request headers. The handler verifies this signature using a shared `MUX_SIGNING_SECRET`, ensuring the event is authentic and hasn't been tampered with.

Once verified, it reads the raw body of the request and parses the event data. If the type matches `video.asset.ready`, it triggers an action — like updating a database or sending a notification. Right now, it just sends a success alert and a response message, but you can expand it however you want (e.g. mark video as playable, store metadata, trigger email).

This webhook is critical for building smooth upload workflows — instead of polling or guessing, you react instantly to Mux's real-time event feed. And by using signature validation, you’re protected against spoofed requests.

To confirm the webhook was hit, check at the logs and for the output message in the console.

### 5\. 🎥 Display the Uploaded Videos

* Fetch uploaded assets from Mux . Create the API Route below:
    

```typescript
// app/api/mux/list/route.ts
import { NextResponse } from "next/server";
import { muxClient } from "@/lib/mux";

export async function GET() {
  try {
    const assets = await muxClient.video.assets.list();
    return NextResponse.json(assets);
  } catch (error: any) {
    console.error("Mux fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

This API route allows your Next.js backend to fetch all video assets from Mux using the official SDK. It defines a `GET` handler at `/api/mux/list`, queries Mux via `muxClient.video.assets.list()`, and returns the data as a JSON response. In case of errors, it logs the issue and sends a structured error message, making the endpoint both developer-friendly and resilient for production use.

* **Render the video thumbnails on client**
    
    To ensure proper rendering of video thumbnail images, include the Mux domain configuration in your `next.config.ts` file as shown below.
    
    ```typescript
    import type { NextConfig } from "next";
    
    const nextConfig: NextConfig = {
      /* config options here */
      images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "image.mux.com",
            port: "",
          },
        ],
      },
    };
    
    export default nextConfig;
    ```
    

This React component, `RenderVideos`, fetches a list of videos from your `/api/mux/list` endpoint when the page loads and stores them in local state. It then displays those videos in a 3-column grid layout using Tailwind CSS. Each video with a valid playback ID is rendered as a thumbnail image sourced from Mux, and wrapped in a clickable link that navigates to a dedicated playback page (`/play-video/{id}`). The video’s title is displayed below each thumbnail for easy identification.

```typescript
// @components/RenderVideos.tsx
"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

  return (
    <div className="grid grid-cols-3 gap-6">
      {videos.map((video: any) =>
        video.playback_ids?.[0] ? (
          <Link
            href={`/play-video/${video.playback_ids?.[0].id}`}
            key={video.id}
            className=""
          >
            <Image
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
```

### 6\. 🎬 Playback & Streaming of Uploaded Videos

When a user clicks on a given video thumbnail ,she is redirected to the page containing the Video Player.

This page component in Next.js dynamically receives a `playBackID` from the URL using route parameters, and uses that ID to render the appropriate video through the `VideoCard` component. By extracting `playBackID` from `params`, it ensures each video can be accessed via a unique route like `/play-video/{playBackID}`. This setup makes the video display modular and scalable, allowing users to view any uploaded video by visiting its corresponding page.

```typescript

//@app/play-video/[playBackID]/page.tsx
import VideoCard from "@/components/VideoCard";
import React from "react";

interface Props {
  params: {
    playBackID: string;
  };
}

const Page = ({ params }: Props) => {
  const { playBackID } = params;

  return (
    <div className="my-8">
      <VideoCard playbackId={playBackID} />
    </div>
  );
};

export default Page;
```

The `VideoCard` component leverages the `MuxPlayer` to stream videos using a provided `playbackId`. This setup allows seamless, on-demand playback and supports adaptive bitrate streaming—meaning the player automatically adjusts video quality based on the viewer’s network conditions for a smooth experience. The player is configured to auto-play, includes custom styling and accent colors, and sends metadata like the video title and user ID for enhanced tracking or personalization. With its responsive design and smart streaming capabilities, `VideoCard` delivers a polished viewing experience across devices.

```typescript
//@components/VideoCard.tsx
"use client";
import MuxPlayer from "@mux/mux-player-react";

export default function VideoCard({ playbackId }: { playbackId: string }) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      autoPlay
      accentColor="#e93458"
      poster={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=5`}
      renditionOrder="desc"
      metadata={{
        video_title: "Uploaded via MuxUploader",
        viewer_user_id: "user-123",
      }}
      style={{
        width: "100%",
        height: 600,
        objectFit: "cover", // ensures video fills the space
      }}
    />
  );
}
```

## 🧠 Final Thoughts: From Glue Code to Graceful Video Flow

Amazon S3 may get you started, but once you're juggling playback quality, backend sync, and webhook reliability, it's easy to get buried in infrastructure complexity. Mux elegantly trims that chaos down to a single, developer-friendly interface—making video uploads in Next.js feel effortless, not endless.

Whether you're building a creator hub, an internal video CMS, or something entirely new, this Mux-powered pipeline gets you scalable uploads, adaptive playback, and reliable event tracking with fewer moving parts.

Want to peek under the hood or clone the repo?

🔗 **Source Code:** [github-source-code](https://github.com/jamesmogambi/nextjs-mux-webhook)

Got ideas, questions, or edge-case chaos? Don’t hesitate to reach out.