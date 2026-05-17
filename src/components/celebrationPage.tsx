import { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Celebration() {
  const navigate = useNavigate();

  useEffect(() => {

    // GRAND CONFETTI BLAST
    const duration = 5000;

    const animationEnd = Date.now() + duration;

    const colors = [
      "#ffb300",
      "#ff7300",
      "#ffffff",
      "#ff4d6d",
      "#ffd166",
    ];

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = window.setInterval(() => {

      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);

      // LEFT SIDE
      confetti({
        particleCount,
        angle: 60,
        spread: 120,
        origin: { x: 0 },
        colors,
        ticks: 300,
        gravity: 0.8,
        scalar: 1.4,
        drift: randomInRange(0.2, 0.6),
      });

      // RIGHT SIDE
      confetti({
        particleCount,
        angle: 120,
        spread: 120,
        origin: { x: 1 },
        colors,
        ticks: 300,
        gravity: 0.8,
        scalar: 1.4,
        drift: randomInRange(-0.6, -0.2),
      });

    }, 250);

    // MEGA CENTER BURST
    setTimeout(() => {

      confetti({
        particleCount: 500,
        spread: 360,
        startVelocity: 45,
        scalar: 1.8,
        ticks: 400,
        gravity: 0.7,
        origin: {
          x: 0.5,
          y: 0.45,
        },
        colors,
      });

    }, 1200);

    setTimeout(() => {
      navigate("/memories");
    }, 12000);

  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top, #2d1b00, #000)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        position: "relative",
        padding: "0px",
      }}
    >
      {/* GOLDEN GLOW */}
      <div
        style={{
          position: "absolute",
          width:
            window.innerWidth < 800
              ? "300px"
              : "700px",
          height:
            window.innerWidth < 800
              ? "300px"
              : "700px",
          borderRadius: "50%",
          background:
            "rgba(255,180,0,0.15)",
          filter: "blur(120px)",
          zIndex: 0,
        }}
      />

      {/* TITLE */}
      <motion.h1
        initial={{
          opacity: 0,
          scale: 0.3,
          y: -100,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 1.2,
          type: "spring",
        }}
        style={{
          color: "white",
          fontWeight: "900",
          textAlign: "center",
          zIndex: 2,
          lineHeight: 1.1,
          marginBottom: "20px",
          fontSize:
            window.innerWidth < 800
              ? "4.5vh"
              : "8vh",
          textShadow:
            "0 0 40px rgba(255,180,0,0.8)",
        }}
      >
        Happy Anniversary ❤️
      </motion.h1>

      {/* SUBTITLE */}
      <motion.p
        initial={{
          opacity: 0,
          y: 40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.8,
          duration: 1,
        }}
        style={{
          color: "#f3f3f3",
          zIndex: 2,
          marginBottom: "50px",
          fontSize:
            window.innerWidth < 800
              ? "1.3rem"
              : "2rem",
          letterSpacing: "2px",
        }}
      >
        Amma & Nanna 💖
      </motion.p>

      {/* IMAGE CONTAINER */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.5,
          rotate: -8,
          y: 120,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: 0,
          y: 0,
        }}
        transition={{
          duration: 1.5,
          type: "spring",
          stiffness: 80,
        }}
        whileHover={{
          scale: 1.03,
        }}
        style={{
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* IMAGE GLOW */}
        <div
          style={{
            position: "absolute",
            inset: "-20px",
            borderRadius: "40px",
            background:
              "linear-gradient(135deg,#ffb300,#ff7300)",
            filter: "blur(40px)",
            opacity: 0.5,
            zIndex: -1,
          }}
        />

        {/* FLOATING HEARTS */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
          }}
          style={{
            position: "absolute",
            top: "-40px",
            left: "-30px",
            fontSize: "40px",
          }}
        >
          ❤️
        </motion.div>

        <motion.div
          animate={{
            y: [10, -10, 10],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
          }}
          style={{
            position: "absolute",
            bottom: "-30px",
            right: "-20px",
            fontSize: "35px",
          }}
        >
          💖
        </motion.div>

        {/* MAIN IMAGE */}
        <motion.img
          src="/image-1.jpg"
          initial={{
            scale: 1.3,
            filter: "blur(15px)",
          }}
          animate={{
            scale: 1,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 1.8,
          }}
          style={{
            width:'auto',

            maxWidth: "80vw",

            height:'55vh',

            objectFit: "cover",

            borderRadius: "35px",

            border:
              "4px solid rgba(255,255,255,0.15)",

            boxShadow:
              "0 30px 100px rgba(0,0,0,0.6)",

            position: "relative",
            zIndex: 2,
          }}
        />

        {/* SHIMMER EFFECT */}
        <motion.div
          initial={{
            x: "-120%",
          }}
          animate={{
            x: "120%",
          }}
          transition={{
            duration: 2,
            delay: 1,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "40%",
            height: "100%",
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)",
            transform: "skewX(-20deg)",
            zIndex: 5,
          }}
        />
      </motion.div>
    </div>
  );
}

export default Celebration;