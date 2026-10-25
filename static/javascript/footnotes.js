for (const ref of document.querySelectorAll(".footnote-reference a")) {
  ref.id = `${ref.hash.slice(1)}_ref`;
}

for (const footnote of document.querySelectorAll(".footnote-definition")) {
  const back = document.createElement("a");
  back.href = `#${footnote.id}_ref`;
  back.textContent = "↩︎";
  footnote.querySelector("p")?.append(back);
}
