import { test, expect } from '@playwright/test'

const SESSION_KEY = 'g-matrix-sensitivity-filters'

test.describe('Allergen filter state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate((key) => {
      window.sessionStorage.removeItem(key)
    }, SESSION_KEY)
    await page.reload()
  })

  test('uses config default in a fresh session', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Gluten' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Milk & Dairy' })).toHaveAttribute('aria-pressed', 'false')

    await expect(page.getByRole('heading', { name: 'E2E Filter Milk Yogurt' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'E2E Filter Nut Bar' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'E2E Filter Egg Pasta' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'E2E Filter Safe Chips' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'E2E Filter Gluten Bread' })).toHaveCount(0)
  })

  test('updates list and preserves allergen state across navigation', async ({ page }) => {
    const glutenChip = page.getByRole('button', { name: 'Gluten' })
    const milkChip = page.getByRole('button', { name: 'Milk & Dairy' })

    await glutenChip.click()
    await expect(glutenChip).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('heading', { name: 'E2E Filter Gluten Bread' })).toBeVisible()

    await milkChip.click()
    await expect(milkChip).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'E2E Filter Milk Yogurt' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Community' }).click()
    await expect(page).toHaveURL(/\/community$/)

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL(/\/$/)

    await expect(glutenChip).toHaveAttribute('aria-pressed', 'false')
    await expect(milkChip).toHaveAttribute('aria-pressed', 'true')

    await expect(page.getByRole('heading', { name: 'E2E Filter Gluten Bread' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'E2E Filter Milk Yogurt' })).toHaveCount(0)
  })

  test('filters newly seeded allergen fixtures', async ({ page }) => {
    const nutsChip = page.getByRole('button', { name: 'Nuts' })
    const eggsChip = page.getByRole('button', { name: 'Eggs' })

    await nutsChip.click()
    await expect(nutsChip).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'E2E Filter Nut Bar' })).toHaveCount(0)

    await eggsChip.click()
    await expect(eggsChip).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'E2E Filter Egg Pasta' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Community' }).click()
    await expect(page).toHaveURL(/\/community$/)

    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL(/\/$/)

    await expect(nutsChip).toHaveAttribute('aria-pressed', 'true')
    await expect(eggsChip).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: 'E2E Filter Nut Bar' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'E2E Filter Egg Pasta' })).toHaveCount(0)
  })
})