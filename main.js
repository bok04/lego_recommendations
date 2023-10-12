// Javascript Imports
import { questions, products } from './data.js';
// Import Custom Web Component
import './modal.js'
// Stylesheets
import './style.css'

document.querySelector('#app').innerHTML = `
  <header>
    <div class="top">
      <div class="layer"></div>
    </div>
    <div class="logo-container">
      <img class="logo" alt="Lego Company Logo" src="./lego-logo-white.png" />
    </div>
  </header>
  <main class="row">
    <div class="col">
      <div class="lego-person-container">
        <img class="lego-person" src="./lego-person.png" alt="Lego Brick Person Waving"/>
      </div>
    </div>
    <div class="col">
      <div class="intro-container">
        <h1>Find the Perfect Lego Gift</h1>
        <p>Need help picking the perfect Lego Gift for someone?</p>
        <p>Answer a selection of questions for a personalised recommendation of Lego gifts.</p>
        <c-modal></c-modal>
      </div>
    </div>
  </main>
  <footer>
    <div class="bottom">
      <div class="layer"></div>
    </div>
  </footer>
`
const modalElement = document.querySelector('c-modal');

modalElement.setContent('questions', questions);
modalElement.setContent('products', products);
