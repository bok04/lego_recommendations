# Lego Recommendations

Small Vite app that recommends Lego sets based on a short quiz.

## Prerequisites
- Node.js 18+ (or any version compatible with Vite 4)

## Setup
```bash
npm install
```

## Run locally
```bash
npm run dev
```
Vite will print the local URL (typically `http://localhost:5173`).

## Build for production
```bash
npm run build
```

## Preview production build
```bash
npm run preview
```

## Project structure
- `index.html`: entry HTML for Vite.
- `main.js`: renders the page shell and wires the modal component.
- `modal.js`: custom element that runs the quiz and renders results.
- `data.js`: questions and product catalog used by the quiz.
- `style.css`: global styles.
- `public/`: static assets (logos, images).

## Updating quiz data
- Edit `data.js` to change questions (`questions`) or products (`products`).
- Keep `attributeId` values aligned between questions and product fields (for example `theme`, `age`, `pieces`, `priceRange`).

## Security audit
```bash
npm audit
```
 
