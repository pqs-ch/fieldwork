# Money, percentages and quantities

Assets: [ui.css](../assets/fieldwork/ui.css). Use native controls and the existing [form controller](form-controller.md); parsing, conversion, precision and calculations belong to the application.

## Default composition

Keep the amount and its meaning together. These illustrative CHF/USD/JPY rules are application choices, not a currency registry supplied by Fieldwork:

```html
<form action="/purchase/review" method="post" class="stack">
  <fieldset class="stack">
    <legend>Price per unit</legend>
    <div class="field">
      <label for="purchase-currency">Currency</label>
      <select id="purchase-currency" name="currency" aria-describedby="currency-hint">
        <option value="CHF">CHF</option><option value="USD">USD</option><option value="JPY">JPY</option>
      </select>
      <p class="hint" id="currency-hint">Changing currency keeps the entered price; no conversion is performed.</p>
    </div>
    <div class="field">
      <label for="purchase-price">Amount per unit</label>
      <input id="purchase-price" name="unit_price" type="text" inputmode="decimal"
        required aria-describedby="price-hint">
      <p class="hint" id="price-hint">CHF/USD: dot or comma decimal separator, up to 2 decimals. JPY: whole amounts without a decimal separator. No grouping.</p>
    </div>
  </fieldset>
  <div class="field">
    <label for="purchase-discount">Discount (%)</label>
    <input id="purchase-discount" name="discount" type="text" inputmode="decimal"
      required aria-describedby="discount-hint">
    <p class="hint" id="discount-hint">Enter 7.5 for 7.5%, not 0.075. Allowed: 0–100, up to 2 decimal places.</p>
  </div>
  <fieldset class="stack">
    <legend>Quantity</legend>
    <div class="field">
      <label for="purchase-quantity">Quantity</label>
      <input id="purchase-quantity" name="quantity" type="text" inputmode="decimal"
        required aria-describedby="quantity-hint">
      <p class="hint" id="quantity-hint">Hours allow up to 3 decimal places; items must be whole numbers.</p>
    </div>
    <div class="field">
      <label for="purchase-unit">Unit</label>
      <select id="purchase-unit" name="unit"><option value="hours">Hours</option><option value="items">Items</option></select>
    </div>
  </fieldset>
  <button class="button" type="submit">Review amounts</button>
</form>
```

For Rails, use the [form helpers](../rails.md#render-a-form) with `inputmode: "decimal"` on text fields and explicit currency/unit selects. Keep hints and errors associated with each control. Use [date ranges](date-and-time.md#date-ranges) when a quantity or price also has a validity/delivery period.

## Entry and validation

Choose controls from the value's meaning. Native text inputs with `inputmode="decimal"` preserve rejected text such as `1,234`, an exponent or excess decimal places for correction. The keyboard hint does not validate anything. `type="number"` can suit quantities when its spinner, step and browser normalization are appropriate; it may sanitize unrepresentable text before the application can retain it. Do not infer a parser from the visual keyboard or use locale-formatted display text as a canonical value.

State the accepted decimal separator, grouping, signs, precision and bounds. Applications may accept one or several decimal separators, but must reject ambiguous combinations instead of guessing. A comma can mean a decimal separator or grouping in different conventions; explain the chosen interpretation. Keep raw attempted strings through validation and transport failures, alongside the confirmed baseline.

- **Money:** show an unambiguous currency code and whether the amount is per unit, a subtotal or a total. Support the application's actual currencies and precision; do not assume every currency has two decimal places or infer currency from a symbol/browser locale.
- **Percentages:** show `%` in the visible label or associated unit. Explain whether the entered value is percentage points, a ratio or a rate. Domain bounds can include negatives or values above 100; the example's 0–100 discount range is not a universal rule.
- **Quantities:** keep the unit visible in the label or a related native select. Specify whole/fractional requirements and precision for each unit. Changing the unit must not silently reinterpret or convert an already reviewed value.

Changing currency, unit or precision must revalidate dependent values on the server. State whether the number stays unchanged or is converted; disclose any actual conversion rate/rule and require a new review when material results change. Optional client hints can help, but native submission must enforce the same rules.

## Canonical values and review

The application owns exact decimal arithmetic and canonical storage, such as supported integer minor units, basis points, scaled quantities or decimal values. Preserve currency/unit metadata with the amount. Do not silently truncate unsupported precision or calculate consequential totals using binary floating-point rounding.

Before confirmation, show normalized quantities, units, currency, intermediate amounts and the final result. State the rounding mode, precision and stage: rounding line subtotals, percentage amounts and final totals can produce different answers. Keep tax, conversion, discounts and other included/excluded effects explicit where they affect the decision. Display formatting must agree with the reviewed canonical values.

Group purchase details separately from the cost breakdown so the final total is easy to find, with its currency visible. Keep the calculation explanation and confirmation action in the same [task surface](layout-primitives.md#continuous-page-sections).

A change after review invalidates that reviewed calculation. Confirm the exact reviewed revision; failure retains it for retry, and repeated confirmation reconciles the original result. Follow [creation](../patterns/creation.md) and [multi-step review](../patterns/multi-step-creation.md) rather than introducing a numeric widget or calculator engine into the library.

The [purchase-request example](../../examples/README.md#purchase-requests-and-business-values) demonstrates raw dot/comma decimal entry, CHF/USD/JPY precision, exact scaled values, percentage and quantity rules, half-up rounding, inclusive date ranges and native/Turbo recovery.
