import { useEffect, useState } from "react"
function LiveClock() {
    const [time, setTime] = useState(() =>
      new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Bogota",
      })
    );
  
    useEffect(() => {
      const clockInterval = setInterval(() => {
        setTime(
          new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "America/Bogota",
          })
        );
      }, 1000);
      return () => clearInterval(clockInterval);
    }, []);
  
    return (
      <div className="shrink-0 px-5 py-4 border-l border-white/10 text-[14px] font-mono text-white/80 min-w-[110px] text-center">
        {time}
      </div>
    );
  }