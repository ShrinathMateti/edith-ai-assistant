import { VscRobot } from "react-icons/vsc";

export default function Loader() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#070a0e]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center w-20 h-20">
          <svg className="absolute inset-0 animate-spin" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeOpacity=".08"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="50 176"
              strokeOpacity=".5"
            />
          </svg>

          <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
            <VscRobot className="w-6 h-6 text-cyan-400 " />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold tracking-tight text-white/90">
            Edith - AI Assistant
          </span>
        </div>

        <div className="flex gap-1.5">
          {[0, 0.15, 0.3].map((d, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
        </div>

        <p className="text-[11px] font-medium text-slate-500 tracking-widest uppercase">
          Loading
        </p>
      </div>
    </div>
  );
}
