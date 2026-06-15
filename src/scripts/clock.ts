const timeLabel = document.querySelector("span[data-local-time]");

const updateTime = () => {
  if (!(timeLabel instanceof HTMLSpanElement)) return;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  timeLabel.textContent = `${formatter.format(now)} BRT`;
};

updateTime();
setInterval(updateTime, 1000);
