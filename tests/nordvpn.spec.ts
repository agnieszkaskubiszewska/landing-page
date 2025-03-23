import { test, expect } from '@playwright/test';

test.describe('NordVPN Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to offer page before each test
    await page.goto('https://nordvpn.com/offer');

    // Wait for page to load
    await page.waitForLoadState('load');

    // Try to accept cookies if they appear
    const acceptButton = page.locator('[data-testid="consent-widget-accept-all"]');
    if ((await acceptButton.count()) > 0) {
      await acceptButton.click();
    }
  });

  test('all CTA buttons lead to pricing page', async ({ page }) => {
    const ctaTexts = ['Get NordVPN', 'Get the Deal', 'Get Extra Savings', 'Try NordVPN Risk-Free'];

    const sections = [
      'h2.heading-xl >> text="Why choose NordVPN?"',
      'section[data-section="CrossSell Section"]',
      'h3.heading-xl.text-primary >> text="Keep your data safe from prying eyes"',
      'h3.heading-xl.text-primary >> text="Enjoy fast and stable connection anywhere"',
      'h2.heading-lg >> text="30-day money-back guarantee"',
      'section[data-section="MoneyBackBanner"]',
      'header[data-section="Hero"]',
    ];

    const selector = ctaTexts
      .map((text) => `button:has-text("${text}"), a:has-text("${text}")`)
      .join(', ');

    const elements = page.locator(selector);
    const count = await elements.count();
    console.log(`Found ${count} CTA elements`);

    // Iterate through sections
    for (let sectionSelector of sections) {
      const section = page.locator(sectionSelector);

      // Wait for section to become visible and assert its presence
      await expect(section).toBeVisible({ timeout: 20000 });

      // Scroll to section
      await section.scrollIntoViewIfNeeded({ timeout: 30000 });

      await page.waitForLoadState('domcontentloaded');

      // Look for CTA buttons in this section
      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);
        if (await element.isVisible()) {
          try {
            await expect(element).toBeVisible({ timeout: 5000 });

            // Click and verify navigation
            await Promise.all([
              page.waitForURL(/.*\/(pricing|checkout).*/, { timeout: 30000 }),
              element.click(),
            ]);

            // Verify we're on the correct page
            await expect(page).toHaveURL(/.*\/(pricing|checkout).*/);

            await page.goto('https://nordvpn.com/offer', { timeout: 30000 });
            await page.waitForLoadState('load');
            break;
          } catch (error) {
            console.error(`✗ Error for element ${i + 1}:`, error);
            throw error;
          }
        }
      }
    }
  });

  test('subscription plan selection leads to appropriate payment page', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('https://nordvpn.com/offer/pricing/');

    // Map plans to expected titles on payment page
    const plans = {
      'Select Ultra': 'Ultra',
      'Select Complete': 'Complete',
      'Select Plus': 'Plus',
      'Select Basic': 'Basic',
    };

    // Get all subscription plan buttons
    const buttons = await page.locator('[data-testid="MultipleHighlightedCards-PlanCard-cta"]');

    // Iterate through buttons and test each one
    for (let i = 0; i < (await buttons.count()); i++) {
      const button = buttons.nth(i);
      const buttonText = (await button.textContent()) || '';

      // Find plan in map
      const expectedPlan = Object.keys(plans).find((plan) => buttonText.includes(plan));
      if (!expectedPlan) continue; // Skip if button text doesn't match

      console.log(`Clicking plan: ${expectedPlan}`);

      await button.click(); // Click button
      await page.waitForLoadState('domcontentloaded');

      // Check if URL contains "payment"
      await expect(page).toHaveURL(/.*\/payment/);

      // Check if correct plan name appears on payment page
      const planTitle = page.locator('[data-testid="CardTitle-title"]');
      await expect(planTitle).toHaveText(plans[expectedPlan]);

      console.log(
        `✅ After clicking "${expectedPlan}", payment page shows: "${plans[expectedPlan]}"`
      );

      // Return to pricing page before next iteration
      await page.goto('https://nordvpn.com/offer/pricing/');
    }
  });

  test('can switch plan from yearly to monthly', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('https://nordvpn.com/pricing/');

    // Click button to select yearly plan
    const yearlyPlanButton = page.locator('[data-testid="PricingDropdown"]').first();
    await yearlyPlanButton.click();

    // Wait for "1-year plans" option to be visible and scroll if needed
    const yearlyOption = page.locator('[data-testid="PricingDropdownOption-1-YEAR"]').first();
    await yearlyOption.waitFor({ state: 'visible' });

    await yearlyOption.click();

    // Select monthly plan
    const monthlyOption = page.locator('[data-testid="PricingDropdownOption-1-MONTH"]').first();
    await monthlyOption.click();

    // Click first available plan button
    const firstPlanButton = page.locator('[data-testid="MultipleHighlightedCards-PlanCard-cta"]');
    await firstPlanButton.waitFor({ state: 'visible' }); // Wait for element visibility
    await firstPlanButton.click();

    // Check if URL changes to payment page
    await expect(page).toHaveURL(/.*\/payment.*/);

    // Return to pricing page
    await page.goBack();

    // Repeat yearly to monthly plan change procedure
    await yearlyPlanButton.click();
    await yearlyOption.click();
    await firstPlanButton.click();

    // Check payment URL again
    await expect(page).toHaveURL(/.*\/payment.*/);

    // Finally return to pricing page
    await page.goto('https://nordvpn.com/pricing/');
  });

  test('Login button leads to login page', async ({ page }) => {
    await page.goto('https://order.nordvpn.com/pl/products/');
    const loginButton = page.locator('[data-testid="UserProfile-login-button"]');

    await loginButton.click();

    // Check if we're on login page
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});
