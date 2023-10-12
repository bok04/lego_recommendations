class Modal extends HTMLElement {
  constructor() {
    super();
    this._modalVisible = false;
    this._modal;
    this._contentIndex = 0; // Index for tracking the current question
    this._answerIndex = null; // Index for the answer
    this._selectedAnswer = null; // Setting the selected answer by the user
    this._questions = []; // Set to an empty array to store questions
    this._answers = []; // Set to an empty array to store answers
    this._products = []; // Set to an empty array to store products
    this._productRecommendations = []; // Set to an empty array to store recommendations or content
    this._startButtonText = null; // TODO: Could be used to allow the user to continue where they last left off
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
    <style>
      @import "./style.css"
    </style>
    <div class="card">
      <button id="start" class="button--start" type="button">${this._startButtonText ?? 'Take the Quiz'}</button>
    </div>
    <div class="modal">
      <div id="modalContainer" class="modal-content">
        <div class="modal-header">
          <span class="close">&times;</span>
          <h1 class="modal-title"></h1>
        </div>
        <div class="modal-body">
          <div id="content"></div>
          <div id="navigation" class="row buttons-container">
            <div class="col col-50 previous-container">
              <button id="previous" class="button--black" type="button">Previous</button>            
            </div>
            <div class="col col-50 next-container">
              <button id="next" disabled="true" class="button--black" type="button">Next</button>            
            </div>
          </div>
          <div id="complete" style="display: none" class="row buttons-container">
            <div class="col col-50 previous-container">
              <button id="restart" class="button--black" type="button">Restart</button>            
            </div>
            <div class="col col-50 next-container">
              <button id="finish" class="button--green" type="button">Finish</button>            
            </div>
          </div>
        </div>
      </div>
    </div>
    `
  }

  // Set Content for Variables required for questions and products
  setContent(type, content) {
    switch(type){
      case 'questions': {
        this._questions = content;
        break;
      }
      case 'products': {
        this._products = content;
        break;
      }
    }
  }

  connectedCallback() {
    this._modal = this.shadowRoot.querySelector(".modal");
    this.shadowRoot.querySelector("#start").addEventListener('click', this._showModal.bind(this));
    this.shadowRoot.querySelector("#next").addEventListener('click', this._showNextContent.bind(this));
    this.shadowRoot.querySelector("#previous").addEventListener('click', this._showPreviousContent.bind(this));
    this.shadowRoot.querySelector(".close").addEventListener('click', this._hideModal.bind(this));
    this.shadowRoot.querySelector("#finish").addEventListener('click', this._hideModal.bind(this));
    this.shadowRoot.querySelector("#restart").addEventListener('click', this._restartQuiz.bind(this));
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector("#start").removeEventListener('click', this._showModal);
    this.shadowRoot.querySelector("#next").removeEventListener('click', this._showNextContent);
    this.shadowRoot.querySelector("#previous").removeEventListener('click', this._showPreviousContent);
    this.shadowRoot.querySelector(".close").removeEventListener('click', this._hideModal);
    this.shadowRoot.querySelector("#finish").addEventListener('click', this._hideModal.bind(this));
    this.shadowRoot.querySelector("#restart").addEventListener('click', this._restartQuiz.bind(this));
  }

  _showModal() {
    // Check which question the user is currently on
    this._modalVisible = true;
    this._modal.style.display = 'block';
    // Disable scrolling for body
    document.body.classList.add('disable-scrolling');
    this._updatePreviousButtonVisibility();
    this._showContentAtIndex(this._contentIndex);
  }

  _hideModal() {
    this._modalVisible = false;
    this._modal.style.display = 'none';
    this._contentIndex = 0;
    this._answerIndex = null;
    this._answers = [];
    sessionStorage.removeItem('userAnswers');
    // Enable scrolling for body
    document.body.classList.remove('disable-scrolling');
    // Display the navigation buttons
    const navigationButtons = this.shadowRoot.querySelector("#navigation");
    navigationButtons.style.display = 'flex';
    // Hide the complete buttons
    const completeButtons = this.shadowRoot.querySelector("#complete");
    completeButtons.style.display = 'none';
  }

  _showNextContent() {
    if (this._questions.length > 0 && this._contentIndex < this._questions.length - 1) {
      this._contentIndex++;
      this._answerIndex = null;
      // Update the functionality
      this._updateNextButtonFunctionality(this._contentIndex);
      this._updatePreviousButtonVisibility();
      this._showContentAtIndex(this._contentIndex);
      // Check the next button disable state
      this._updateNextButtonDisableState();
    }
    else {
      // Reached the end of the array and final set of questions
      // Update the functionality
      this._updateNextButtonFunctionality(this._contentIndex);
      // Show product recommendations
      this._showProductRecommendations();
      // Hide the navigation buttons
      const navigationButtons = this.shadowRoot.querySelector("#navigation");
      navigationButtons.style.display = 'none';
      // Display the complete buttons
      const completeButtons = this.shadowRoot.querySelector("#complete");
      completeButtons.style.display = 'flex';
    }
  }

  _showPreviousContent() {
    if (this._questions.length > 0 && this._contentIndex > 0) {
      this._contentIndex--;
      // Show the previous content first
      this._showContentAtIndex(this._contentIndex);
      // Load user answers from session storage
      const userAnswersJSON = sessionStorage.getItem('userAnswers');
      let userAnswers = userAnswersJSON ? JSON.parse(userAnswersJSON) : [];

      if (Array.isArray(userAnswers)) {
        // Get the previously selected answer for the current question
        const currentQuestion = this._questions[this._contentIndex];
        const previousAnswer = userAnswers.find(answer => answer.attributeId === currentQuestion.attributeId);

        if (previousAnswer) {
          // Remove the answer for the next screen
          userAnswers = userAnswers.filter(answer => answer.attributeId !== currentQuestion.attributeId);
          // Update the session storage
          sessionStorage.setItem('userAnswers', JSON.stringify(userAnswers));
        }

        const radioButtons = this.shadowRoot.querySelectorAll('.radio-button');
        const selectedRadioButton = Array.from(radioButtons).find(input => input.value === previousAnswer.answer);
        if (selectedRadioButton) {
          // Select the previously chosen radio button
          selectedRadioButton.checked = true;
          this._answerIndex = currentQuestion.answers.findIndex(answer => answer.value === previousAnswer.answer);
          this._selectedAnswer = previousAnswer;
          this._updateNextButtonDisableState();
        }
      }
      this._updatePreviousButtonVisibility();
    }
  }

  _showContentAtIndex(index) {
    const currentQuestion = this._questions[index];
    // Store Answers Locally if the _answers is empty
    if(Array.isArray(this._answers) && !this._answers.length){
      this._answers = currentQuestion.answers;
    }
    // Set the Title of the Question
    this.shadowRoot.querySelector("h1").textContent = currentQuestion.title;

    // Create a fieldset to hold the radio buttons
    const fieldset = document.createElement('fieldset');

    // Create a radio button group to track the selected answer
    const radioGroup = document.createElement('div');
    radioGroup.classList.add('radio-group');

    // Iterate through the answers and create radio buttons
    this._answers.forEach((answer, answerIndex) => {
      const label = document.createElement('label');
      label.htmlFor = answer.value.toLowerCase();

      const input = document.createElement('input');
      input.id = answer.value.toLowerCase();
      input.type = 'radio';
      input.classList.add('radio-button')
      input.name =  currentQuestion.attributeId;
      input.value = answer.value;

      // Create an image div if an image is present in the data
      if (answer.image !== undefined){
        const imageDiv = document.createElement('div');
        imageDiv.classList.add('modal-image-container');
        const image = document.createElement('img');
        image.src = answer.image;
        imageDiv.appendChild(image);
        label.appendChild(imageDiv);
      }

      const span = document.createElement('span');
      span.innerHTML = answer.value;
      label.appendChild(span);

      radioGroup.appendChild(input);
      radioGroup.appendChild(label);
      fieldset.appendChild(radioGroup);

      // Highlight the selected answer based on _answerIndex
      if (answerIndex === this._answerIndex) {
        input.checked = true;
      }

      // Add event listener to enable the next button when an answer is selected
      input.addEventListener('change', () => {
        this._answerIndex = answerIndex;
        this._selectedAnswer = {
          answer: answer.value,
          attributeId: currentQuestion.attributeId
        };
        this._updateNextButtonDisableState();
      });
    });

    // Clear the existing answers and append the new fieldset
    this._answers = [];
    const contentContainer = this.shadowRoot.querySelector("#content");
    contentContainer.innerHTML = '';
    fieldset.appendChild(radioGroup);
    contentContainer.appendChild(fieldset);
  }

  _showProductRecommendations() {
    // Create an unordered list to hold the product items
    const productsList = document.createElement('ul');
    productsList.classList.add('product-list');

    // Loop through the product recommendations to build the HTML content
    if(Array.isArray(this._productRecommendations) && this._productRecommendations.length > 0){
      // Set the title of the product recommendations
      this.shadowRoot.querySelector("h1").textContent = "We think these would be great gift ideas";

      this._productRecommendations.forEach((product) => {
        // Create a list item for each product
        const productItem = document.createElement('li');
        productItem.classList.add('product-item');

        // Create an anchor link for the list item
        const productUrl = document.createElement('a');
        productUrl.href = product.url;
        productUrl.target = '_blank';

        // Create an image element for the product image
        const productImage = document.createElement('img');
        productImage.src = product.image;
        productImage.alt = product.name;

        // Create a container for product details
        const productDetails = document.createElement('div');
        productDetails.classList.add('product-details');

        // Create a heading for the product name
        const productName = document.createElement('h2');
        productName.textContent = product.name;

        // Create a paragraph for the product price
        const productPrice = document.createElement('p');
        productPrice.classList.add('product-price');
        productPrice.textContent = `Price: £${product.price.toFixed(2)}`;

        // Create a paragraph for the product pieces
        const productPieces = document.createElement('p');
        productPieces.classList.add('product-pieces');
        productPieces.textContent = `Pieces: ${product.pieces}`;

        // Create a paragraph for the call to action
        const productCallToAction = document.createElement('div');
        productCallToAction.classList.add('product-cta');
        productCallToAction.textContent = 'Click Here For More Details';

        // Append image, name, and price to the product details container
        productDetails.appendChild(productImage);
        productDetails.appendChild(productName);
        productDetails.appendChild(productPrice);
        productDetails.appendChild(productPieces);

        // Append product details, product call to action to the anchor link
        productUrl.appendChild(productDetails);
        productUrl.appendChild(productCallToAction);

        // Append product details container to the product item
        productItem.appendChild(productUrl);

        // Append product item to the product list
        productsList.appendChild(productItem);
      });
    }
    else {
      // Set the title of the error message
      this.shadowRoot.querySelector("h1").textContent = "Ooops... it looks like we couldn\'t find any products";
      // Create a paragraph for the couldn't find any recommendations
      const errorMessage = document.createElement('p');
      errorMessage.classList.add('product-error');
      errorMessage.textContent = 'Sorry we couldn\'t recommend any products. Please restart the quiz and try again.';

      productsList.appendChild(errorMessage);
    }

    const contentContainer = this.shadowRoot.querySelector("#content");
    contentContainer.innerHTML = '';
    contentContainer.appendChild(productsList);
  }


  _updateNextButtonDisableState() {
    const nextButton = this.shadowRoot.querySelector('#next');
    // Check if there is an answer to remove the disabled attribute
    if(this._answerIndex !== null){
      nextButton.disabled = false;
    }
    else {
      nextButton.disabled = true;
    }
  }

  _updateNextButtonText() {
    // Check the content index to display button text
    const nextButton = this.shadowRoot.querySelector('#next');
    // Find the last array index and check if it matches the contentIndex
    if((this._questions.length -1) === this._contentIndex){
      nextButton.innerHTML = 'See Results';
    }
    else {
      nextButton.innerHTML = 'Next';
    }
  }

  _updateNextButtonFunctionality() {
    // Get user answers from session storage
    const userAnswersJSON = sessionStorage.getItem('userAnswers');
    let userAnswers = userAnswersJSON ? JSON.parse(userAnswersJSON) : [];

    if (!Array.isArray(userAnswers)) {
      userAnswers = [];
    }

    // Check if the selected attributeId already exists in userAnswers and replace it
    if (this._selectedAnswer && this._selectedAnswer.attributeId) {
      // Find the index of the existing answer with the same attributeId, if it exists
      const existingAnswerIndex = userAnswers.findIndex(answer => answer.attributeId === this._selectedAnswer.attributeId);

      // If an existing answer was found, replace it or add the new answer to the array
      if (existingAnswerIndex !== -1) {
        userAnswers[existingAnswerIndex].answer = this._selectedAnswer.answer;
      }
      else {
        userAnswers.push({
          attributeId: this._selectedAnswer.attributeId,
          answer: this._selectedAnswer.answer
        });
      }
      // Save the updated user answers back to session storage
      sessionStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    }

    // Cycle through the products depending on the answers in session storage
    let filteredProducts = [];
    userAnswers.forEach((answer, answerIndex) => {
      switch(answer.attributeId){
        case 'theme': {
          filteredProducts = this._products.filter((element) => element[`${answer.attributeId}`] == answer.answer);
          break;
        }
        case 'age': {
          // Filter based on the previous filter rather than "this._products" as theme is the first index in the array
          filteredProducts = filteredProducts.filter((element) => element[`${answer.attributeId}`] == answer.answer);
          break;
        }
        case 'pieces': {
          // Find the range values for piecs and price
          const rangeValues = this._questions[answerIndex].answers.find((element) => element.value === answer.answer);
          if (rangeValues.highest !== undefined) {
            // Filter with highest and lowest range values
            filteredProducts = filteredProducts.filter((element) =>
              element[`${answer.attributeId}`] >= rangeValues.lowest &&
              element[`${answer.attributeId}`] <= rangeValues.highest
            );
          } else {
            // Filter only with the lowest range values
            filteredProducts = filteredProducts.filter((element) =>
              element[`${answer.attributeId}`] >= rangeValues.lowest
            );
          }
          break;
        }
        case 'price': {
          filteredProducts = filteredProducts.filter((element) => element.priceRange == answer.answer);
          break;
        }
      }
      // Set the Product Recommendations
      this._productRecommendations = filteredProducts;
    });

    let updatedAnswers = [];
    // Depending on the answer selected return only answers that can match for the next question based on the filtered products above
    const nextQuestion = this._questions[this._contentIndex];
    switch(nextQuestion.attributeId){
      case 'age': {
        const uniqueAges = new Set(filteredProducts.map((product) => product.age));
        // Filter the answers based on what is available from the filtered products matched with age
        updatedAnswers = this._questions[this._contentIndex].answers.filter((answer) => {
          return uniqueAges.has(answer.value);
        });
        this._answers = updatedAnswers;
        break;
      }
      case 'pieces': {
        // Purposely left so we could return no recommended products
        // TODO: Would be to filter products further based on pieces available from the selected age range
        break;
      }
      case 'price': {
        const uniquePrices = new Set(filteredProducts.map((product) => product.priceRange));
        // Filter the answers based on what is available from the filtered products matched with price range
        updatedAnswers = this._questions[this._contentIndex].answers.filter((answer) => {
          return uniquePrices.has(answer.value);
        });
        this._answers = updatedAnswers;
        break;
      }
    }
  }

  _updatePreviousButtonVisibility() {
    // Updates the visibility of previous as the user navigates each question. Hides if contentIndex is 0, displays if not
    const previousButton = this.shadowRoot.querySelector("#previous");
    previousButton.style.display = this._contentIndex > 0 ? 'block' : 'none';
  }

  _restartQuiz() {
    // Clear session storage
    sessionStorage.removeItem('userAnswers');
    // Reset the content index to start from the beginning
    this._contentIndex = 0;
    this._answerIndex = null;
    this._selectedAnswer = null;
    this._answers = [];
    // Update Buttons
    this._updateNextButtonText();
    this._updatePreviousButtonVisibility();
    // Show the initial content
    this._showContentAtIndex(this._contentIndex);
    // Display the navigation buttons
    const navigationButtons = this.shadowRoot.querySelector("#navigation");
    navigationButtons.style.display = 'flex';
    // Hide the complete buttons
    const completeButtons = this.shadowRoot.querySelector("#complete");
    completeButtons.style.display = 'none';
  }

}
customElements.define('c-modal', Modal);
