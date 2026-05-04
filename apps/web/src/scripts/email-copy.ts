import { animate, scrambleText, type JSAnimation } from "animejs";

const emailButtons = document.querySelectorAll(
  "button[data-email][data-default-label][data-copied-label]",
);

for (const emailButton of emailButtons) {
  if (!(emailButton instanceof HTMLButtonElement)) continue;

  const label = emailButton.querySelector("[data-copy-label]");
  if (!(label instanceof HTMLElement)) continue;

  const defaultLabel =
    emailButton.dataset.defaultLabel ?? label.textContent ?? "[email]";
  const copiedLabel = emailButton.dataset.copiedLabel ?? "[copied]";
  const failedLabel = emailButton.dataset.failedLabel ?? "[failed to copy]";

  let resetTimer: ReturnType<typeof setTimeout> | null = null;
  let activeAnimation: JSAnimation | null = null;

  label.textContent = defaultLabel;

  const stopAnimation = () => {
    if (!activeAnimation) return;

    activeAnimation.revert();
    activeAnimation = null;
  };

  const animateLabelTo = (text: string) => {
    stopAnimation();

    activeAnimation = animate(label, {
      innerHTML: scrambleText({
        text,
      }),
      onComplete: () => {
        activeAnimation = null;
        label.textContent = text;
      },
    });
  };

  emailButton.addEventListener("click", async () => {
    const email = emailButton.dataset.email;
    if (!email) return;

    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }

    try {
      await navigator.clipboard.writeText(email);
      animateLabelTo(copiedLabel);
    } catch {
      animateLabelTo(failedLabel);
    }

    resetTimer = setTimeout(() => {
      animateLabelTo(defaultLabel);
    }, 2000);
  });
}
