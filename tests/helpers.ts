import { Page, Locator } from '@playwright/test';

/**
 * Accepts cookies dialog if it appears on the page
 * @param page The Playwright page object
 * @returns Promise resolving when cookies are accepted or dialog is not present
 */
export async function acceptCookiesIfPresent(page: Page): Promise<void> {
  const acceptButton = page.locator('[data-testid="consent-widget-accept-all"]');
  if ((await acceptButton.count()) > 0) {
    await acceptButton.click();
  }
}

/**
 * Waits for page to load and ensures cookies are accepted if needed
 * @param page The Playwright page object
 * @param url URL to navigate to
 */
export async function navigateAndPrepare(page: Page, url: string): Promise<void> {
  try {
    // Użyj dłuższego timeoutu i nie czekaj na pełne załadowanie strony
    await page.goto(url, {
      timeout: 60000,
      waitUntil: 'domcontentloaded', // Zamiast 'load' - szybciej
    });

    // Czekaj na pojawienie się konkretnego elementu jako wskaźnik, że strona jest użyteczna
    await page.waitForSelector('body', { timeout: 10000 });

    await acceptCookiesIfPresent(page);
  } catch (error) {
    console.log(`Nawigacja do ${url} nie powiodła się: ${error}`);
    // Kontynuuj mimo błędu - testy same obsłużą dalszą logikę
  }
}

/**
 * Attempts to click a button and waits for navigation
 * @param button Locator for the button to click
 * @param page The Playwright page object
 * @param urlPattern Expected URL pattern after click
 * @returns Promise<boolean> - true if click succeeded, false otherwise
 */
export async function clickAndWaitForNavigation(
  button: Locator,
  page: Page,
  urlPattern: RegExp
): Promise<boolean> {
  try {
    await button.click();
    await page.waitForURL(urlPattern, { timeout: 30000 });
    return true;
  } catch (error) {
    return false;
  }
}
