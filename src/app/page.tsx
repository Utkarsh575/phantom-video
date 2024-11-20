"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  DollarSign,
  Send,
  QrCode,
  PanelRight,
  Search,
  Loader2,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { captureComponentAsImage } from "@/lib/capture";
import { Toaster, toast } from "react-hot-toast";

export default function Component() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedExample, setSelectedExample] = useState("");
  const [overlayData, setOverlayData] = useState({
    initials: "CD",
    range: "$1,250 to $125,000",
    amount: "$47,892.65",
    gainAmount: "+$2.34",
    gainPercentage: "+18.72%",
    change: "+$2.34",
    percentage: "+18.72%",
    solanaBalance: "223.45",
    solanaPrice: "$124.83",
    solanaChange: "+$4.87",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const [overlayImage, setOverlayImage] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasGeneratedVideo, setHasGeneratedVideo] = useState(false);
  const [recentVideos, setRecentVideos] = useState<
    Array<{ id: number; url: string; created_at: string }>
  >([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      if (videoRef.current) {
        const videoURL = URL.createObjectURL(e.target.files[0]);
        videoRef.current.src = videoURL;
        videoRef.current.play();
      }
    }
  };
  const exampleVideos: { [key: string]: string } = {
    space:
      "https://gcsufutkzbkjfygxvcpr.supabase.co/storage/v1/object/public/generated-videos/space.mp4",
    nature:
      "https://gcsufutkzbkjfygxvcpr.supabase.co/storage/v1/object/public/generated-videos/nature.mp4?t=2024-11-14T14%3A56%3A32.180Z",
    city: "https://gcsufutkzbkjfygxvcpr.supabase.co/storage/v1/object/public/generated-videos/city.mp4?t=2024-11-14T14%3A56%3A30.328Z",
  };

  const handleExampleSelect = (value: string) => {
    setSelectedExample(value);
    setVideoFile(null);

    if (videoRef.current) {
      videoRef.current.src = exampleVideos[value];
      videoRef.current.load();
      videoRef.current.play().catch((e) => console.log("Video play error:", e));
    }
  };

  const handleCaptureAndProcess = async () => {
    if (hasGeneratedVideo) {
      handleReset();
      return;
    }

    const elementId = "overlay-content";
    setIsProcessing(true);

    try {
      const overlayImageBlob = await captureComponentAsImage(elementId);

      if (!videoFile && !selectedExample) {
        toast("Please select or upload a video!", {
          icon: <Info />,
        });
        return;
      }

      const formData = new FormData();
      if (videoFile) {
        formData.append("video", videoFile);
      } else {
        const exampleVideos: { [key: string]: string } = {
          space:
            "https://gcsufutkzbkjfygxvcpr.supabase.co/storage/v1/object/public/generated-videos/space.mp4",
          nature:
            "https://gcsufutkzbkjfygxvcpr.supabase.co/storage/v1/object/public/generated-videos/nature.mp4?t=2024-11-14T14%3A56%3A32.180Z",
          city: "https://gcsufutkzbkjfygxvcpr.supabase.co/storage/v1/object/public/generated-videos/city.mp4?t=2024-11-14T14%3A56%3A30.328Z",
        };
        formData.append("videoUrl", exampleVideos[selectedExample]);
      }
      formData.append("overlayImage", overlayImageBlob);

      const response = await fetch("/api/process-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData.error);
        toast.error("Failed to process video.");
        return;
      }

      const responseData = await response.json();
      console.log(responseData);
      const videoUrl = responseData.url.outputs["output.mp4"];
      setDownloadLink(videoUrl);
      setHasGeneratedVideo(true);
      toast.success("Video processed successfully!");
      fetchRecentVideos();
    } catch (error) {
      console.error(error);
      toast.error("Error processing video.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureOverlay = async () => {
    if (isOverlayVisible) {
      setOverlayImage(null);
      setIsOverlayVisible(false);
      return;
    }

    const elementId = "overlay-content";
    const overlayImageBlob = await captureComponentAsImage(elementId);
    setOverlayImage(overlayImageBlob);
    setIsOverlayVisible(true);
  };

  const handleReset = () => {
    setVideoFile(null);
    setSelectedExample("");
    setDownloadLink("");
    setOverlayImage(null);
    setHasGeneratedVideo(false);
    if (videoRef.current) {
      videoRef.current.src = "";
    }
    setOverlayData({
      initials: "CD",
      range: "$1,250 to $125,000",
      amount: "$47,892.65",
      gainAmount: "+$2.34",
      gainPercentage: "+18.72%",
      change: "+$2.34",
      percentage: "+18.72%",
      solanaBalance: "223.45",
      solanaPrice: "$124.83",
      solanaChange: "+$4.87",
    });
  };

  const fetchRecentVideos = async () => {
    try {
      const response = await fetch("/api/fetch-recent-videos");
      const data = await response.json();
      if (data.videos) {
        setRecentVideos(data.videos);
      }
    } catch (error) {
      console.error("Error fetching recent videos:", error);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? recentVideos.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === recentVideos.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    fetchRecentVideos();
  }, []);

  return (
    <div className="min-h-screen bg-[#1b1d28] text-white p-4">
      <div className="space-y-8 w-full max-w-2xl mx-auto">
        <Card className="bg-[#1b1d28] border-[#87efac]">
          <CardHeader>
            <CardTitle className="text-white text-center text-3xl">
              Phantom Wallet Montage Generator
            </CardTitle>
            <CardDescription className="text-white opacity-80  text-center">
              Create a cool phantom wallet edit just like the one in this post{" "}
              <a
                href="https://x.com/early404/status/1855100614625128675"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#87efac] hover:text-[#87efac] hover:opacity-90 text-xs sm:text-sm  "
              >
                https://x.com/early404/status/1855100614625128675
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="video"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Upload Video
              </Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="example"
                className="text-white text-sm sm:text-lg font-semibold"
              >
                Or choose an example
              </Label>
              <Select onValueChange={handleExampleSelect}>
                <SelectTrigger className="bg-[#87efac] text-[#1b1d28]">
                  <SelectValue placeholder="Select an example" />
                </SelectTrigger>
                <SelectContent className="bg-[#87efac] text-[#1b1d28]">
                  <SelectItem value="space">Space Journey</SelectItem>
                  <SelectItem value="nature">Nature Timelapse</SelectItem>
                  <SelectItem value="city">City Nightlife</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="range"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Range
              </Label>
              <Input
                id="range"
                value={overlayData.range}
                onChange={(e) =>
                  setOverlayData({ ...overlayData, range: e.target.value })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="amount"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Amount
              </Label>
              <Input
                id="amount"
                value={overlayData.amount}
                onChange={(e) =>
                  setOverlayData({ ...overlayData, amount: e.target.value })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="gainAmount"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Gain Amount
              </Label>
              <Input
                id="gainAmount"
                value={overlayData.gainAmount}
                onChange={(e) =>
                  setOverlayData({ ...overlayData, gainAmount: e.target.value })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="solanaBalance"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Solana Balance
              </Label>
              <Input
                id="solanaBalance"
                value={overlayData.solanaBalance}
                onChange={(e) =>
                  setOverlayData({
                    ...overlayData,
                    solanaBalance: e.target.value,
                  })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="solanaPrice"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Solana Price
              </Label>
              <Input
                id="solanaPrice"
                value={overlayData.solanaPrice}
                onChange={(e) =>
                  setOverlayData({
                    ...overlayData,
                    solanaPrice: e.target.value,
                  })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="solanaChange"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Solana Change
              </Label>
              <Input
                id="solanaChange"
                value={overlayData.solanaChange}
                onChange={(e) =>
                  setOverlayData({
                    ...overlayData,
                    solanaChange: e.target.value,
                  })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="gainPercentage"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Gain Percentage
              </Label>
              <Input
                id="gainPercentage"
                value={overlayData.gainPercentage}
                onChange={(e) =>
                  setOverlayData({
                    ...overlayData,
                    gainPercentage: e.target.value,
                  })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="initials"
                className="text-white text-sm sm:text-base font-semibold"
              >
                Initials
              </Label>
              <Input
                id="initials"
                value={overlayData.initials}
                onChange={(e) =>
                  setOverlayData({ ...overlayData, initials: e.target.value })
                }
                className="bg-[#87efac] text-[#1b1d28]"
              />
            </div>
            {(videoFile || selectedExample) && (
              <video
                ref={videoRef}
                controls
                className="w-full mt-4"
                crossOrigin="anonymous"
                src={
                  videoFile
                    ? URL.createObjectURL(videoFile)
                    : selectedExample
                    ? exampleVideos[selectedExample]
                    : undefined
                }
                autoPlay
                loop
              >
                Your browser does not support the video tag.
              </video>
            )}
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            {isProcessing ? (
              <Loader2 className="text-white animate-spin" />
            ) : (
              <Button
                className="w-full bg-blue-500 text-white hover:bg-blue-600 hover:opacity-90"
                onClick={handleCaptureAndProcess}
                disabled={isProcessing || (!videoFile && !selectedExample)}
              >
                {hasGeneratedVideo ? "Generate Another" : "Generate"}
              </Button>
            )}

            {!hasGeneratedVideo && (
              <Button
                className="w-full bg-purple-500 text-white hover:bg-purple-600 hover:opacity-90"
                onClick={handleCaptureOverlay}
              >
                {isOverlayVisible ? "Hide Overlay" : "Display Overlay Image"}
              </Button>
            )}

            {downloadLink && (
              <Button className="w-full bg-green-500 text-white hover:bg-green-600 hover:opacity-90">
                <Download />
                <span className="">
                  <a
                    href={downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download your video
                  </a>
                </span>
              </Button>
            )}

            {overlayImage && isOverlayVisible && !hasGeneratedVideo && (
              <div className="mt-4 animate-fade-in animate-fade-out transition-all duration-700">
                <h1 className="text-white text-2xl font-bold text-center">
                  Overlay Image
                </h1>
                <Image
                  src={URL.createObjectURL(overlayImage)}
                  alt="Overlay Image"
                  className="w-full h-auto"
                  width={500}
                  height={500}
                />
              </div>
            )}
            <p className="text-sm text-center text-white opacity-80">
              Built with ❤️ by the CrackedDevs team. &nbsp;
              <a
                href="https://crackeddevs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500"
              >
                Need devs?
              </a>
            </p>
          </CardFooter>
        </Card>

        <PhantomWalletOverlay
          initials={overlayData.initials}
          range={overlayData.range}
          amount={overlayData.amount}
          gainAmount={overlayData.gainAmount}
          gainPercentage={overlayData.gainPercentage}
          solanaBalance={overlayData.solanaBalance}
          solanaPrice={overlayData.solanaPrice}
          solanaChange={overlayData.solanaChange}
        />

        {recentVideos.length > 0 && (
          <Card className="bg-[#1b1d28] border-[#87efac]">
            <CardHeader>
              <CardTitle className="text-white">Recently Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {recentVideos.map((video) => (
                      <div key={video.id} className="w-full  flex-shrink-0">
                        <video
                          src={getProxiedVideoUrl(video.url)}
                          className="w-full h-full object-cover rounded-md"
                          controls
                          autoPlay
                          playsInline
                          muted
                        />
                        <div className="mt-2">
                          <p className="text-sm text-white opacity-80">
                            Generated on{" "}
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {recentVideos.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-[#87efac] text-[#1b1d28] hover:bg-[#87efac] hover:opacity-90"
                      onClick={prevSlide}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-[#87efac] text-[#1b1d28] hover:bg-[#87efac] hover:opacity-90"
                      onClick={nextSlide}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}
interface PhantomWalletOverlayProps {
  initials: string;
  range: string;
  amount: string;
  gainAmount: string;
  gainPercentage: string;
  solanaBalance: string;
  solanaPrice: string;
  solanaChange: string;
}
const PhantomWalletOverlay = ({
  initials,
  range,
  amount,
  gainAmount,
  gainPercentage,
  solanaBalance,
  solanaPrice,
  solanaChange,
}: PhantomWalletOverlayProps) => {
  return (
    <div
      id="overlay-content"
      className="-z-10 absolute top-0 left-0 w-[50px] h-[50px] bg-black opacity-[70%] flex flex-col items-center justify-start bg-gradient-to-b from-green-900 to-transparent "
    >
      <div className="flex items-center justify-between space-x-2 w-full  ">
        <div className="flex items-center justify-center gap-5 mx-5 my-2  ">
          <div className="bg-purple-500  rounded-full w-[50px] h-[50px] text-center flex items-center  justify-center translate-y-[3px]">
            <h1 className="text-neutral-200 text-xl font-bold -translate-y-[9px] font-roboto">
              {initials}
            </h1>
          </div>
          <span className="text-white text-xl font-semibold -translate-y-2 font-roboto">
            {range}
          </span>
        </div>
        <div className="flex items-center justify-center">
          <Search className="text-white w-8 h-8 mr-10" />
          <PanelRight className="text-white w-8 h-8 mr-5" />
        </div>
      </div>
      <div className=" mt-5 mb-5 ">
        <h1 className="text-white text-5xl font-bold font-roboto">{amount}</h1>
      </div>
      <div className="flex items-center justify-center ">
        <div className=" mr-2 mt-2 -translate-y-3">
          <h1 className="text-green-500 text-2xl font-base font-roboto">
            {gainAmount}
          </h1>
        </div>
        <div className=" bg-green-900 rounded-md  mt-1">
          <h1 className="text-2xl  text-green-500 -translate-y-2 roboto">
            {gainPercentage}
          </h1>
        </div>
      </div>
      <div className="flex space-x-4 mt-10 font-roboto">
        <button className="bg-[#2a2a2a] text-neutral-300 font-bold w-[100px] h-[100px] justify-center rounded-2xl flex flex-col items-center">
          <QrCode className="text-[#ab9ff2]" /> Receive
        </button>
        <button className="bg-[#2a2a2a] text-neutral-300 font-bold w-[100px] h-[100px] justify-center rounded-2xl flex flex-col items-center">
          <Send className="text-[#ab9ff2]" /> Send
        </button>
        <button className="bg-[#2a2a2a] text-neutral-300 font-bold w-[100px] h-[100px] justify-center rounded-2xl flex flex-col items-center">
          <ArrowRightLeft className="text-[#ab9ff2]" /> Swap
        </button>
        <button className="bg-[#2a2a2a] text-neutral-300 font-bold w-[100px] h-[100px] justify-center rounded-2xl flex flex-col items-center">
          <DollarSign className="text-[#ab9ff2]" /> Buy
        </button>
      </div>
      <div className="bg-[#2a2a2a] text-white p-4 pb-5  flex items-center justify-between w-[90%] rounded-2xl mt-10">
        <div className="flex items-center justify-center">
          <div>
            <Image
              src="/solana.avif"
              alt="Solana Logo"
              className="h-12 w-12 rounded-full mr-2"
              width={150}
              height={150}
            />
          </div>
          <div className="-translate-y-2">
            <div className="text-neutral-300 font-bold text-lg font-roboto">
              Solana
            </div>
            <div className="text-neutral-500 font-bold text-md font-roboto">
              {solanaBalance}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end -translate-y-2 font-roboto">
          <div>{solanaPrice}</div>
          <div className="text-green-500 font-roboto">{solanaChange}</div>
        </div>
      </div>
    </div>
  );
};

const getProxiedVideoUrl = (originalUrl: string) => {
  return `/api/proxy-video?url=${encodeURIComponent(originalUrl)}`;
};
