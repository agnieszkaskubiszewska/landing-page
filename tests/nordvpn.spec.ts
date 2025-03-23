/* eslint-disable playwright/no-conditional-in-test */
/* eslint-disable playwright/no-force-option */
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
      'header[data-section="Hero"]',
      'h2.heading-xl >> text="Why choose NordVPN?"',
      'section[data-section="CrossSell Section"]',
      'h3.heading-xl.text-primary >> text="Keep your data safe from prying eyes"',
      'h3.heading-xl.text-primary >> text="Enjoy fast and stable connection anywhere"',
      'h2.heading-lg >> text="30-day money-back guarantee"',
      'section[data-section="MoneyBackBanner"]',
    ];

    const selector = ctaTexts
      .map((text) => `button:has-text("${text}"), a:has-text("${text}")`)
      .join(', ');

    for (let sectionSelector of sections) {
      await page.goto('https://nordvpn.com/offer', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const section = page.locator(sectionSelector);
      const sectionVisible = await section.isVisible().catch(() => false);

      if (!sectionVisible) {
        continue;
      }

      await section.scrollIntoViewIfNeeded();
      /* eslint-disable-next-line playwright/no-wait-for-timeout */
      await page.waitForTimeout(1000);
      const ctaButtons = page.locator(selector);
      const count = await ctaButtons.count();

      for (let i = 0; i < count; i++) {
        const button = ctaButtons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible) {
          await Promise.all([
            page.waitForURL(/.*\/(pricing|checkout).*/, { timeout: 30000 }),
            button.click(),
          ]);

          const url = page.url();
          await expect(url).toMatch(/.*\/(pricing|checkout).*/);
          break;
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
    } as const;

    type PlanKey = keyof typeof plans;

    // Get all subscription plan buttons
    const buttons = await page.locator('[data-testid="MultipleHighlightedCards-PlanCard-cta"]');

    // Iterate through buttons and test each one
    for (let i = 0; i < (await buttons.count()); i++) {
      const button = buttons.nth(i);
      const buttonText = (await button.textContent()) || '';

      // Find plan in map
      const expectedPlan = Object.keys(plans).find((plan) => buttonText.includes(plan)) as PlanKey;
      if (!expectedPlan) continue;

      await button.click(); // Click button
      await page.waitForLoadState('domcontentloaded');

      // Check if URL contains "payment"
      await expect(page).toHaveURL(/.*\/payment/);

      // Check if correct plan name appears on payment page
      const planTitle = page.locator('[data-testid="CardTitle-title"]');
      await expect(planTitle).toHaveText(plans[expectedPlan]);

      // Return to pricing page before next iteration
      await page.goto('https://nordvpn.com/offer/pricing/');
    }
  });

  test('can switch plan from yearly to monthly', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('https://nordvpn.com/pricing/');

    // Click button to select yearly plan
    const yearlyPlanButton = page.locator('[data-testid="PricingDropdown"]').first();
    await yearlyPlanButton.click({ force: true });

    await page.evaluate(() => {
      const selectElement = document.querySelector('select');
      if (selectElement) {
        selectElement.value = '1y';
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Click first available plan button
    await page.evaluate(() => {
      const button = document.querySelector(
        '[data-testid="MultipleHighlightedCards-PlanCard-cta"][data-ga-slug="Get Ultra"]'
      ) as HTMLElement;
      if (button) {
        button.click();
      }
    });

    // Wait for the Ultra plan title to appear on the payment page
    await expect(page.locator('[data-testid="CardTitle-title"]').first()).toHaveText(/Ultra/);

    // Return to pricing page
    await page.goBack();

    // Repeat yearly to monthly plan change procedure
    await yearlyPlanButton.click();
    // Select monthly plan
    await page.evaluate(() => {
      const selectElement = document.querySelector('select');
      if (selectElement) {
        selectElement.value = '1m';
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Check payment URL again
    await page.evaluate(() => {
      const button = document.querySelector(
        '[data-testid="MultipleHighlightedCards-PlanCard-cta"][data-ga-slug="Get Ultra"]'
      ) as HTMLElement;
      if (button) {
        button.click();
      }
    });

    // Check if URL changes to payment page
    await expect(page).toHaveURL(/.*\/payment.*/);
    await expect(page.locator('[data-testid="CardTitle-title"]').first()).toHaveText(/Ultra/);

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
