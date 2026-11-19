import { enhanceSearchableSelect } from 'fieldwork/searchable-select';
export const purchaseEnhancements=[
  {selector:'[data-searchable-selection]',mount(root) {
    return enhanceSearchableSelect(root,root.hasAttribute('data-supplier-lookup') ? {async loadOptions(term,{signal}) {
      const response=await fetch(`/purchase-request/suppliers/options?q=${encodeURIComponent(term)}`,{signal});
      if (!response.ok) throw new Error('Supplier lookup is unavailable.');
      return response.json();
    }} : {});
  }},
  {selector:'#purchase-form',mount(form,{signal}) {
    const priceHint=form.querySelector('#entry_unit_price-hint');
    const quantityHint=form.querySelector('#entry_quantity-hint');
    const originalPrice=priceHint.textContent,originalQuantity=quantityHint.textContent;
    function rules(event) {
      if (event && !['entry[currency]','entry[unit]'].includes(event.target.name)) return;
      const currency=form.querySelector('[name="entry[currency]"]').value;
      const unit=form.querySelector('[name="entry[unit]"]').value;
      priceHint.textContent=currency==='JPY' ? 'JPY: 0–1,000,000, whole amounts only.' : `${currency}: 0–1,000,000, up to 2 decimals.`;
      quantityHint.textContent=unit==='items' ? '1–1,000 whole items.' : '0.001–1,000 hours, up to 3 decimals.';
    }
    form.addEventListener('change',rules,{signal});rules();
    return ()=>{priceHint.textContent=originalPrice;quantityHint.textContent=originalQuantity;};
  }}
];
