# NordVPN Landing Page – Automated Tests  

This project contains automated UI tests for the NordVPN landing page using the Playwright testing framework.  

## Features Tested  

- Navigation to pricing pages via CTA buttons  
- Subscription plan selection and payment page validation  
- Plan switching options (yearly/monthly)  
- Login button functionality verification  

## Requirements  

- Node.js (version 18+ recommended)  
- npm  

## Installation  

1. Clone the repository:  
   ```sh
   git clone https://github.com/agnieszkaskubiszewska/landing-page.git  
   cd landing-page  
   ```  
2. Install dependencies:  
   ```sh
   npm install  
   ```  
3. Install Playwright browsers:  
   ```sh
   npx playwright install  
   ```  

## Running Tests  

- Run all tests:  
  ```sh
  npm test  
  ```  
- Run tests in UI mode:  
  ```sh
  npm run test:ui  
  ```  
- Run tests with the browser visible:  
  ```sh
  npm run test:headed  
  ```  
- Lint code:  
  ```sh
  npm run lint  
  ```  
- Format code:  
  ```sh
  npm run format  
  ```  

## Project Structure  

landing-page/  
├── tests/                # Automated tests  
│   ├── helpers.ts        # Helper functions for tests  
│   └── nordvpn.spec.ts   # Test scenarios for NordVPN  
├── playwright.config.ts  # Playwright configuration  
├── .eslintrc.js          # ESLint configuration  
├── .prettierrc.js        # Prettier configuration  
├── .github/workflows/    # GitHub Actions configuration  
└── package.json         # Dependencies and scripts  

## Continuous Integration  

The project uses GitHub Actions to automatically run tests on each pull request and changes to the main branch. The configuration can be found in `.github/workflows/playwright.yml`.  
