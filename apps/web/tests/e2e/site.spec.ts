import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('homepage renders without horizontal overflow or serious accessibility issues', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Creative minds. Commercial instincts.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get your growth audit' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  await page.screenshot({
    path: `test-results/omniscale-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    results.violations
      .filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
      .map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
  ).toEqual([]);
  expect(errors).toEqual([]);
});
test('calculator responds to inputs and preserves a manually selected currency', async ({
  page,
}) => {
  await page.goto('/calculator');
  await page.getByLabel('Display currency').selectOption('USD');
  await expect(page.getByText('+$13,600')).toBeVisible();
  await page.getByLabel('Average order value').fill('100');
  await expect(page.getByText('+$16,000')).toBeVisible();
  await page.getByLabel('Display currency').selectOption('BDT');
  await expect(page.getByText('All amounts are in BDT.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Display currency')).toHaveValue('BDT');
});
test('audit wizard validates each step and handles unconfigured storage honestly', async ({
  page,
}) => {
  await page.goto('/audit');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Enter a full URL, including https://').first()).toBeVisible();
  await page.getByLabel('Your website').fill('https://example.com');
  await page.getByLabel('Your primary competitor').fill('https://competitor.example');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your name').fill('Alex Morgan');
  await page.getByLabel('Work email').fill('alex@example.com');
  await page.getByLabel('LinkedIn profile').fill('https://www.linkedin.com/in/alex');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Request my audit' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Audit requests are not open yet' }),
  ).toBeVisible();
  await expect(page.getByText('Your growth audit is in.')).toHaveCount(0);
});
test('portfolio filters and opens an explicitly illustrative blueprint', async ({ page }) => {
  await page.goto('/case-studies');
  await page.getByRole('button', { name: 'B2B SaaS', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Show the outcome. Skip the feature tour.' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Make the everyday unskippable.' })).toHaveCount(
    0,
  );
  await page
    .getByRole('link')
    .filter({
      has: page.getByRole('heading', { name: 'Show the outcome. Skip the feature tour.' }),
    })
    .click();
  await expect(
    page.getByText(
      'Concept study. All performance figures below are test targets, not achieved results.',
    ),
  ).toBeVisible();
});
test('booking and admin fail closed without credentials', async ({ page }) => {
  await page.goto('/booking');
  await expect(
    page.getByText('Online scheduling is opening soon.', { exact: false }),
  ).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'Sign in to OmniScale' })).toBeDisabled();
  await expect(page.getByText('Setup required:', { exact: false })).toBeVisible();
});
test('booking UX handles timezone selection and returns a private management link (mocked API)', async ({
  page,
}) => {
  const slot = {
    id: 'bd37c7e0-754e-49e8-93e9-058ba73b7383',
    starts_at: '2027-01-12T09:00:00Z',
    ends_at: '2027-01-12T09:30:00Z',
  };
  await page.route('**/api/availability', (route) =>
    route.fulfill({ json: { configured: true, slots: [slot] } }),
  );
  await page.route('**/api/bookings', async (route) => {
    const data = route.request().postDataJSON();
    expect(data.timezone).toBe('Asia/Dhaka');
    expect(data.email).toBe('alex@example.com');
    await route.fulfill({
      status: 201,
      json: { ...slot, id: data.requestId, status: 'confirmed', token: 'a'.repeat(64) },
    });
  });
  await page.goto('/booking');
  await page.getByLabel('Your timezone').selectOption('Asia/Dhaka');
  await page.getByRole('button', { name: /Jan 12/ }).click();
  await page.getByLabel('Your name').fill('Alex Morgan');
  await page.getByLabel('Work email').fill('alex@example.com');
  await page.getByLabel('Your website').fill('https://example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirm discovery call' }).click();
  await expect(page.getByRole('heading', { name: 'Your discovery call is booked.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /booking\/manage#/ })).toHaveAttribute(
    'href',
    `http://127.0.0.1:3000/booking/manage#${'a'.repeat(64)}`,
  );
});
test('pricing explains payments are opening soon without credentials', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByRole('heading', { name: 'Clear scopes. Honest economics.' })).toBeVisible();
  await expect(
    page.getByText('Online payments are opening soon.', { exact: false }),
  ).toBeVisible();
});
test('API rejects foreign origins and unauthenticated worker calls', async ({ request }) => {
  const audit = await request.post('/api/audit', {
    headers: { origin: 'https://attacker.example' },
    data: {},
  });
  expect(audit.status()).toBe(403);
  const worker = await request.post('/api/internal/notifications');
  expect(worker.status()).toBe(401);
  const stripe = await request.post('/api/internal/stripe-proof');
  expect(stripe.status()).toBe(401);
});
