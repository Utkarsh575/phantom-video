import { NextResponse } from "next/server";
import StreamPot from "@streampot/client";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();

    // Get either the video file or URL
    const videoFile = formData.get("video") as File;
    const videoUrl = formData.get("videoUrl") as string;
    const overlayImageFile = formData.get("overlayImage") as File;

    if ((!videoFile && !videoUrl) || !overlayImageFile) {
      return NextResponse.json(
        { error: "Both video (file or URL) and overlay image are required." },
        { status: 400 }
      );
    }

    let finalVideoUrl: string;

    // Handle video source based on whether it's a file or URL
    if (videoFile) {
      // Upload video file to Supabase if it's a file
      const videoFileName = `video-${uuidv4()}.mp4`;
      const { error: videoError } = await supabase.storage
        .from("temp-videos")
        .upload(videoFileName, videoFile);

      if (videoError) {
        console.log("videoError", videoError);
        return NextResponse.json(
          { error: "Failed to upload video file." },
          { status: 500 }
        );
      }

      finalVideoUrl = `${supabaseUrl}/storage/v1/object/public/temp-videos/${videoFileName}`;
    } else {
      // Use the provided URL directly if it's an example video
      finalVideoUrl = videoUrl;
    }

    // Upload overlay image
    const overlayFileName = `overlay-${uuidv4()}.png`;
    const { error: overlayError } = await supabase.storage
      .from("temp-overlays")
      .upload(overlayFileName, overlayImageFile);

    if (overlayError) {
      console.log("overlayError", overlayError);
      return NextResponse.json(
        { error: "Failed to upload overlay image." },
        { status: 500 }
      );
    }

    const overlayUrl = `${supabaseUrl}/storage/v1/object/public/temp-overlays/${overlayFileName}`;

    const streampot = new StreamPot({
      secret: process.env.STREAMPOT_API_KEY!,
    });

    // Process the video with the overlay using the finalVideoUrl
    const watermarkedVideo = await streampot
      .input(finalVideoUrl)
      .input(overlayUrl)
      .complexFilter([
        {
          filter: "crop",
          options: { w: 500, h: 500, x: 0, y: 0 }, // Crop the video to 500x500
          inputs: "0:v",
          outputs: "cropped",
        },
        {
          filter: "scale",
          options: { w: 500, h: 500 }, // Scale the overlay to 500x500
          inputs: "1:v",
          outputs: "scaled",
        },
        {
          filter: "overlay",
          options: { x: 0, y: 0 }, // Position the overlay at the top-left corner
          inputs: ["cropped", "scaled"],
        },
      ])
      .output("output.mp4")
      .runAndWait();

    // Insert the processed video URL into recent-videos table
    const { error: insertError } = await supabase
      .from('recent-videos')
      .insert([
        {
          url: watermarkedVideo.outputs["output.mp4"],
          created_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      console.error("Error inserting video record:", insertError);
    }

    // Clean up temporary files
    if (videoFile) {
      // Only delete the video file if it was uploaded (not an example URL)
      await supabase.storage
        .from("temp-videos")
        .remove([finalVideoUrl.split("/").pop()!]);
    }
    await supabase.storage.from("temp-overlays").remove([overlayFileName]);

    return NextResponse.json({ url: watermarkedVideo });
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      { error: "Failed to process video." },
      { status: 500 }
    );
  }
};
