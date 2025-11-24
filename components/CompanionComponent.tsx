"use client";

// TODO: This functionality needs more fine-tuning
// delete log statements and shit

import { cn, configureAssistant, getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const CompanionComponent = ({
  name,
  subject,
  topic,
  style,
  userName,
  userImage,
  voice,
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  useEffect(() => {
    if (lottieRef) {
      if (isSpeaking) {
        lottieRef.current?.play();
      } else {
        lottieRef.current?.stop();
      }
    }
  }, [isSpeaking, lottieRef]);

  useEffect(() => {
    const onCallStart = () => {
      console.log("✅ VAPI call started");
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      console.log("❌ VAPI call ended");
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      console.log("📨 VAPI message:", message);

      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = {
          role: message.role,
          content: message.transcript,
        };

        setMessages((prev) => [newMessage, ...prev]);
      }
    };

    const onSpeechStart = () => {
      console.log("🎤 Speech started");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("🔇 Speech ended");
      setIsSpeaking(false);
    };

    const onError = (error: any) => {
      console.error("❌ VAPI Error Type:", error?.type);
      console.error("❌ VAPI Error Stage:", error?.stage);

      if (error?.error instanceof Response) {
        console.error("❌ Response Status:", error.error.status);
        console.error("❌ Response StatusText:", error.error.statusText);
        console.error("❌ Response Type:", error.error.type);
        console.error("❌ Response URL:", error.error.url);

        // Try to read response body
        error.error
          .clone()
          .text()
          .then((text: string) => {
            console.error("❌ Response Body:", text);
          })
          .catch((e: any) => console.error("Could not read response body:", e));
      }

      console.error("Full error object:", error);
      setCallStatus(CallStatus.INACTIVE);
    };

    // vapi event listeners
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);

    // cleanup
    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
    };
  }, []);

  const toggleMicrophone = () => {
    const isMuted = vapi.isMuted();
    vapi.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  const handleCall = async () => {
    console.log("🟢 handleCall triggered");
    setCallStatus(CallStatus.CONNECTING);

    const assistantConfig = configureAssistant(voice, style);
    console.log("🔧 Assistant config:", assistantConfig);

    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
      },
      clientMessages: ["transcript"],
      serverMessages: [],
    };

    console.log("🚀 Starting vapi with overrides:", assistantOverrides);

    try {
      // @ts-expect-error
      await vapi.start(assistantConfig, assistantOverrides);
      console.log("✅ vapi.start() completed");
    } catch (error) {
      console.error("❌ vapi.start() failed:", error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  return (
    <section className="flex flex-col h-[70vh]">
      <section className="flex gap-8 max-sm:flex-col">
        <div className="companion-section">
          <div
            className="companion-avatar"
            style={{ backgroundColor: getSubjectColor(subject) }}
          >
            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.FINISHED ||
                  callStatus === CallStatus.INACTIVE
                  ? "opacity-100"
                  : "opacity-0",
                callStatus === CallStatus.CONNECTING &&
                  "opacity-100 animate-pulse"
              )}
            >
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={150}
                height={150}
                className="max-sm:w-fit"
              />
            </div>
            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0"
              )}
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={soundwaves}
                autoplay={false}
                className="companion-lottie"
              />
            </div>
          </div>
          <p className="font-bold text-2xl">{name}</p>
        </div>

        {/* shows the user */}
        <div className="user-section">
          <div className="user-avatar">
            <Image
              src={userImage}
              alt={userName}
              width={130}
              height={130}
              className="rounded-lg"
            />
            <p className="font-bold text-2xl">{userName}</p>
          </div>

          {/* mic button */}
          <button
            className="btn-mic"
            onClick={toggleMicrophone}
            disabled={callStatus !== CallStatus.ACTIVE}
          >
            <Image
              src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
              alt="mic"
              width={36}
              height={36}
            />
            <p className="max-sm:hidden">
              {isMuted ? "Turn on Mic" : "Turn off Mic"}
            </p>
          </button>

          {/* lets u connect to the call */}
          <button
            className={cn(
              "rounded-lg py-2 cursor-pointer transition-colors w-full text-white",
              callStatus === CallStatus.ACTIVE ? "bg-red-700" : "bg-primary",
              callStatus === CallStatus.CONNECTING && "animate-pulse"
            )}
            onClick={
              callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall
            }
          >
            {callStatus === CallStatus.ACTIVE
              ? "End Session"
              : callStatus === CallStatus.CONNECTING
              ? "Connecting"
              : "Start Session"}
          </button>
        </div>
      </section>

      {/* Displays transcript */}
      <section className="transcript">
        <div className="transcript-message no-scrollbar">
          {messages.map((message, index) => {
            if (message.role === "user") {
              return (
                <p key={index} className="max-sm:text-sm">
                  {userName}:{message.content}
                </p>
              );
            } else {
              return (
                <p key={index} className="text-primary max-sm:text-sm">
                  {name} : {message.content}
                </p>
              );
            }
          })}
        </div>
        <div className="transcript-fade" />
      </section>
    </section>
  );
};

export default CompanionComponent;
