const emailButtons = document.querySelectorAll(
  "button[data-email][data-default-label][data-copied-label]",
);

for (const emailButton of emailButtons) {
  if (!(emailButton instanceof HTMLButtonElement)) continue;

  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  emailButton.addEventListener("click", async () => {
    const email = emailButton.dataset.email;
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      emailButton.textContent = emailButton.dataset.copiedLabel ?? "[copied]";
    } catch {
      emailButton.textContent = "[failed to copy]";
    }

    if (resetTimer) {
      clearTimeout(resetTimer);
    }

    resetTimer = setTimeout(() => {
      emailButton.textContent = emailButton.dataset.defaultLabel ?? "[email]";
    }, 2000);
  });
}
