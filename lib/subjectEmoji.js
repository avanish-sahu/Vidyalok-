const EMOJI_MAP = {
  maths: "📐",
  english: "📖",
  physics: "⚛️",
  chemistry: "🧪",
  biology: "🧬",
  history: "📜",
  geography: "🌍",
  "computer-science": "💻",
  "social-science": "🌍",
  hindi: "🅰️",
};

export function subjectEmoji(slug) {
  return EMOJI_MAP[slug] || "📚";
}
