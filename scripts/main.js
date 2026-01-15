// CISL Website - Minimal JavaScript

// Copy BibTeX to clipboard
function copyBibTeX(button) {
  const bibtex = button.closest('.bibtex');
  const codeElement = bibtex.querySelector('code');
  const text = codeElement.textContent;

  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied';

    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
  });
}
