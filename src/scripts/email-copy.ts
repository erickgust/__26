import { animate, type JSAnimation, scrambleText } from "animejs";

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
  const status = emailButton.parentElement?.querySelector("[data-copy-status]");

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

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      label.textContent = text;
      return;
    }

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

    if (status) status.textContent = "";

    try {
      await navigator.clipboard.writeText(email);
      animateLabelTo(copiedLabel);
      if (status) status.textContent = "Email address copied";
    } catch {
      animateLabelTo(failedLabel);
      if (status) {
        status.textContent =
          "Couldn't copy the email address. Opening your mail app.";
      }
      window.location.href = `mailto:${email}`;
    }

    resetTimer = setTimeout(() => {
      animateLabelTo(defaultLabel);
      if (status) status.textContent = "";
    }, 2000);
  });
}
