interface Props {
  remainingSeconds: number;
}

export default function Timer({ remainingSeconds }: Props) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const low = remainingSeconds <= 30;

  return (
    <div
      className={`font-mono font-bold text-3xl tabular-nums ${
        low ? "text-error animate-pulse" : "text-accent"
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
