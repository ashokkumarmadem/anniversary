import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa";

function RealCakeCut() {
  const [isCutting, setIsCutting] = useState(false);
  const [cutPosition, setCutPosition] = useState(0);
  const [cutDone, setCutDone] = useState(false);
  const [showKnifeAnimation, setShowKnifeAnimation] =
    useState(false);

  const containerRef: any = useRef(null);

  const navigate = useNavigate();

  // SOUND REFS
  const cutSoundRef =
    useRef<HTMLAudioElement | null>(null);

  const celebrationSoundRef =
    useRef<HTMLAudioElement | null>(null);

  // PRELOAD SOUNDS
  useEffect(() => {
    const cutAudio = new Audio("/cake-cut.mp3");
    cutAudio.preload = "auto";
    cutAudio.volume = 1;

    const celebrationAudio = new Audio(
      "/celebration.mp3"
    );
    celebrationAudio.preload = "auto";
    celebrationAudio.volume = 0.8;

    cutSoundRef.current = cutAudio;
    celebrationSoundRef.current =
      celebrationAudio;
  }, []);

  const handlePointerDown = () => {
    if (cutDone) return;

    setIsCutting(true);
  };

  const handlePointerMove = (e: any) => {
    if (!isCutting || cutDone) return;

    const rect =
      containerRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left;

    setCutPosition(x);

    if (x > rect.width / 2) {
      finishCut();
    }
  };

  const handlePointerUp = () => {
    setIsCutting(false);
  };

  // FINISH CUT
  const finishCut = () => {
    if (cutDone) return;

    setCutDone(true);

    // PLAY CUT SOUND
    if (cutSoundRef.current) {
      cutSoundRef.current.currentTime = 0;

      cutSoundRef.current
        .play()
        .catch(() => {});
    }

    // PLAY CELEBRATION SOUND
    setTimeout(() => {
      if (celebrationSoundRef.current) {
        celebrationSoundRef.current.currentTime =
          0;

        celebrationSoundRef.current
          .play()
          .catch(() => {});
      }
    }, 700);

    // CONFETTI
    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.6 },
    });

    // OPTIONAL NAVIGATION
    setTimeout(() => {
      navigate("/celebration");
    }, 3000);
  };

  // BUTTON CUT
  const handleButtonCut = () => {
    if (cutDone) return;

    setShowKnifeAnimation(true);

    setTimeout(() => {
      finishCut();
      setShowKnifeAnimation(false);
    }, 1800);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background:
          "linear-gradient(to bottom, #1a1a1a, #000)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* GOLDEN GLOW */}
      <div
        style={{
          position: "absolute",
          width:
            window.innerWidth < 800 ? "300px" : "700px",
          height:
            window.innerWidth < 800 ? "300px" : "700px",
          background: "rgba(255,180,0,0.15)",
          filter: "blur(120px)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      {/* TITLE */}
      <motion.h1
        initial={{
          opacity: 0,
          y: -60,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 1,
        }}
        style={{
          color: "white",
          fontWeight: "900",
          textAlign: "center",
          zIndex: 2,
          lineHeight: 1.2,
          marginBottom: "25px",
          fontSize:
            window.innerWidth < 800
              ? "4.2vh"
              : "7vh",
          textShadow:
            "0 0 30px rgba(255,180,0,0.5)",
        }}
      >
        Happy Anniversary ❤️
      </motion.h1>

      {/* SUBTITLE */}
      {/* <motion.p
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.5,
        }}
        style={{
          color: "#ddd",
          textAlign: "center",
          maxWidth: "900px",
          zIndex: 2,
          marginBottom: "35px",
          fontSize:
            window.innerWidth < 800
              ? "1rem"
              : "1.5rem",
        }}
      >
        Celebrate this beautiful journey together 🎉
      </motion.p> */}

      {/* BUTTON */}
      <motion.button
        whileHover={
          cutDone
            ? {}
            : {
                scale: 1.08,
                boxShadow:
                  "0 0 40px rgba(255,180,0,0.8)",
              }
        }
        whileTap={cutDone ? {} : { scale: 0.95 }}
        onClick={handleButtonCut}
        disabled={cutDone}
        style={{
          marginBottom: "40px",

          padding:
            window.innerWidth < 800
              ? "16px 34px"
              : window.innerWidth < 1600
              ? "22px 55px"
              : "30px 75px",

          minHeight:
            window.innerWidth < 800
              ? "60px"
              : window.innerWidth < 1600
              ? "85px"
              : "110px",

          borderRadius: "999px",

          border:
            "1px solid rgba(255,255,255,0.15)",

          background: cutDone
            ? "linear-gradient(135deg,#666,#444)"
            : "linear-gradient(135deg,#ffb300,#ff7300)",

          color: "white",

          fontSize:
            window.innerWidth < 800
              ? "18px"
              : window.innerWidth < 1600
              ? "28px"
              : "42px",

          fontWeight: "900",

          lineHeight: 1,

          cursor: cutDone
            ? "not-allowed"
            : "pointer",

          zIndex: 5,

          position: "relative",

          overflow: "hidden",

          opacity: cutDone ? 0.75 : 1,

          transition: "0.3s",

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          gap: "14px",

          backdropFilter: "blur(10px)",

          boxShadow: cutDone
            ? "0 10px 30px rgba(0,0,0,0.3)"
            : "0 20px 60px rgba(255,170,0,0.35)",

          letterSpacing: "1px",

          whiteSpace: "nowrap",
        }}
      >
        {cutDone
          ? "🎉 Cake Cut Successfully"
          : "🔪 Cut The Cake"}
      </motion.button>

      {/* CAKE AREA */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          zIndex: 2,
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* FULL CAKE */}
        <motion.img
          src="/cake-full.png"
          alt="cake"
          initial={{
            scale: 0.7,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            duration: 1,
          }}
          style={{
            width:
              window.innerWidth < 800
                ? "92%"
                : "42%",
            borderRadius: "25px",
            filter:
              "drop-shadow(0 20px 50px rgba(255,180,0,0.35))",
          }}
        />

        {/* DRAG KNIFE */}
        {isCutting && !cutDone &&(
          <motion.img
            src="/knife.png"
            alt="knife"
            animate={{
              x: cutPosition - 60,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
            }}
            style={{
              position: "absolute",
              top: "40%",
              left: 0,
              width:
                window.innerWidth < 800
                  ? "120px"
                  : "8vw",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}

        {/* BUTTON KNIFE ANIMATION */}
        {showKnifeAnimation && !cutDone && (
          <motion.img
            src="/knife.png"
            alt="knife"
            initial={{
              x:
                window.innerWidth < 800
                  ? -250
                  : -600,
              y: -30,
              rotate: -25,
            }}
            animate={{
              x:
                window.innerWidth < 800
                  ? 260
                  : 1000,
              y: 60,
              rotate: 20,
            }}
            transition={{
              duration: 1.6,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: "35%",
              left: "15%",
              width:
                window.innerWidth < 800
                  ? "100px"
                  : "180px",
              zIndex: 20,
            }}
          />
        )}

        {/* CUT LINE */}
        {isCutting && !cutDone && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: cutPosition,
              width: "4px",
              height: "100%",
              background: "white",
              boxShadow:
                "0 0 20px rgba(255,255,255,0.9)",
            }}
          />
        )}

        {/* SPLIT CAKE */}
        {cutDone && (
          <>
            {/* LEFT HALF */}
            <motion.img
              src="/cake-left.png"
              initial={{
                x: 0,
                rotate: 0,
              }}
              animate={{
                x:
                  window.innerWidth < 800
                    ? -80
                    : -180,
                rotate: -8,
              }}
              transition={{
                duration: 1.2,
              }}
              style={{
                position: "absolute",
                top: 0,
                left:
                  window.innerWidth < 800
                    ? "12%"
                    : "29%",
                width:
                  window.innerWidth < 800
                    ? "38%"
                    : "17%",
                borderRadius: "20px",
                filter:
                  "drop-shadow(0 20px 50px rgba(255,180,0,0.35))",
              }}
            />

            {/* RIGHT HALF */}
            <motion.img
              src="/cake-left.png"
              initial={{
                x: 0,
                rotate: 0,
              }}
              animate={{
                x:
                  window.innerWidth < 800
                    ? 80
                    : 180,
                rotate: 8,
              }}
              transition={{
                duration: 1.2,
              }}
              style={{
                position: "absolute",
                top: 0,
                right:
                  window.innerWidth < 800
                    ? "12%"
                    : "29%",
                width:
                  window.innerWidth < 800
                    ? "38%"
                    : "17%",
                borderRadius: "20px",
                filter:
                  "drop-shadow(0 20px 50px rgba(255,180,0,0.35))",
              }}
            />

            {/* SUCCESS MESSAGE */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: 0.5,
              }}
              style={{
                position: "absolute",
                bottom:
                  window.innerWidth < 800
                    ? "-100px"
                    : "-140px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "15px",
                color: "white",
                fontWeight: "bold",
                fontSize:
                  window.innerWidth < 800
                    ? "2.5vh"
                    : "5vh",
                textShadow:
                  "0 0 30px rgba(255,180,0,0.8)",
              }}
            >
              <FaHeart color="#ffb300" />
              Cake Cut Successfully
              <FaHeart color="#ffb300" />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

export default RealCakeCut;