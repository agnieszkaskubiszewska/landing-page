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
      'header[data-section="Hero"]', // Zaczynamy od sekcji Hero
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

    // Iteracja przez sekcje
    for (let sectionSelector of sections) {
      console.log(`Checking section: ${sectionSelector}`);
      await page.goto('https://nordvpn.com/offer', { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Sprawdź czy sekcja istnieje
      const section = page.locator(sectionSelector);
      const sectionVisible = await section.isVisible().catch(() => false);

      if (!sectionVisible) {
        console.log(`Section not found: ${sectionSelector}`);
        continue;
      }

      // Przewiń do sekcji
      await section.scrollIntoViewIfNeeded();
      /* eslint-disable-next-line playwright/no-wait-for-timeout */
      await page.waitForTimeout(1000);
      const ctaButtons = page.locator(selector);
      const count = await ctaButtons.count();

      // Jeśli istnieje widoczny przycisk CTA, kliknij w pierwszy z nich
      for (let i = 0; i < count; i++) {
        const button = ctaButtons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible) {
          console.log(`Clicking CTA button in section: ${sectionSelector}`);

          // Kliknij przycisk i zaczekaj na zmianę URL
          await Promise.all([
            page.waitForURL(/.*\/(pricing|checkout).*/, { timeout: 30000 }),
            button.click(),
          ]);

          // Sprawdź czy URL zawiera 'pricing' lub 'checkout'
          const url = page.url();
          await expect(url).toMatch(/.*\/(pricing|checkout).*/);
          console.log(`✓ Successfully navigated to: ${url}`);

          // Po udanym teście dla tej sekcji przejdź do następnej
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
    await yearlyPlanButton.click({ force: true });

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
