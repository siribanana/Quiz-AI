interface Props {
  remainingSeconds: number;
}

export default function Timer({ remainingSeconds }: Props) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const low = remainingSeconds <= 30;

  return (
    <div
      className={`text-2xl font-mono font-bold tabular-nums ${
        low ? "text-red-600 animate-pulse" : ""
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
