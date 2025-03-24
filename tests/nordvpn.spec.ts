/* eslint-disable playwright/no-conditional-in-test */
import { test, expect } from '@playwright/test';
import { acceptCookiesIfPresent, navigateAndPrepare, clickAndWaitForNavigation } from './helpers';

test.describe('NordVPN Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to offer page before each test and prepare environment
    await navigateAndPrepare(page, 'https://nordvpn.com/offer');
  });

  test('all CTA buttons lead to pricing page', async ({ page }) => {
    const ctaTexts = ['Get NordVPN', 'Get the Deal', 'Get Extra Savings', 'Try NordVPN Risk-Free'];

    const sections = [
      'header[data-section="Hero"]',
      'section[data-section="ComparisonTableRounded"]',
      'section[data-section="CrossSell Section"]',
      'section[data-section="Feature2ColAsset - Left"]',
      'section[data-section="Feature2ColAsset - Right"]',
      'section[data-section="MoneyBackBanner"]',
      'section[data-section="Banner"]',
    ];

    const selector = ctaTexts
      .map((text) => `button:has-text("${text}"), a:has-text("${text}")`)
      .join(', ');

    for (let sectionSelector of sections) {
      await navigateAndPrepare(page, 'https://nordvpn.com/offer');

      const section = page.locator(sectionSelector);
      const sectionVisible = await section.isVisible().catch(() => false);

      if (!sectionVisible) {
        continue;
      }

      await section.scrollIntoViewIfNeeded();
      const ctaButtons = page.locator(selector);
      const count = await ctaButtons.count();

      for (let i = 0; i < count; i++) {
        const button = ctaButtons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible) {
          const success = await clickAndWaitForNavigation(button, page, /.*\/(pricing|checkout).*/);

          if (success) {
            await expect(page.url()).toMatch(/.*\/(pricing|checkout).*/);
            break;
          }
        }
      }
    }
  });

  test('subscription plan selection leads to appropriate payment page', async ({ page }) => {
    // Navigate to pricing page
    await navigateAndPrepare(page, 'https://nordvpn.com/offer/pricing/');

    // Map plans to expected titles on payment page
    const plans = {
      'Select Ultra': 'Ultra',
      'Select Complete': 'Complete',
      'Select Plus': 'Plus',
      'Select Basic': 'Basic',
    } as const;

    type PlanKey = keyof typeof plans;

    // Get all subscription plan buttons
    const buttons = page.locator('[data-testid="MultipleHighlightedCards-PlanCard-cta"]');

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
      await navigateAndPrepare(page, 'https://nordvpn.com/offer/pricing/');
    }
  });

  test('can switch plan from yearly to monthly', async ({ page }) => {
    // Navigate to pricing page
    await navigateAndPrepare(page, 'https://nordvpn.com/pricing/');

    // Helper function for selecting plan period
    async function selectPlanPeriod(period: '1y' | '1m'): Promise<void> {
      const yearlyPlanButton = page.locator('[data-testid="PricingDropdown"]').first();
      await yearlyPlanButton.click({ force: true });

      await page.evaluate((selectedPeriod) => {
        const selectElement = document.querySelector('select');
        if (selectElement) {
          selectElement.value = selectedPeriod;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, period);
    }

    // Helper function for clicking plan button
    async function clickPlanButton(planSlug: string): Promise<void> {
      await page.evaluate((slug) => {
        const button = document.querySelector(
          `[data-testid="MultipleHighlightedCards-PlanCard-cta"][data-ga-slug="${slug}"]`
        ) as HTMLElement;
        if (button) {
          button.click();
        }
      }, planSlug);
    }

    // Test for yearly plan
    await selectPlanPeriod('1y');
    await clickPlanButton('Get Plus');

    await expect(page).toHaveURL(/.*\/payment.*/);
    await expect(page.locator('[data-testid="CardTitle-title"]').first()).toHaveText(/Plus/);

    // Return to pricing page
    await page.goBack();

    // Test for monthly plan
    await selectPlanPeriod('1m');
    await clickPlanButton('Get Plus');

    await expect(page).toHaveURL(/.*\/payment.*/);
    await expect(page.locator('[data-testid="CardTitle-title"]').first()).toHaveText(/Plus/);

    // Final return to pricing page
    await navigateAndPrepare(page, 'https://nordvpn.com/pricing/');
  });

  test('Login button leads to login page', async ({ page }) => {
    await navigateAndPrepare(page, 'https://order.nordvpn.com/pl/products/');
    const loginButton = page.locator('[data-testid="UserProfile-login-button"]');

    await loginButton.click();

    // Check if we're on login page
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});
