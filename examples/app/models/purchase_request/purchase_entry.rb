module PurchaseRequest
  require 'bigdecimal'
  require 'date'
  class PurchaseEntry
    include ActiveModel::Model
    FIELDS = %w[supplier currency unit_price discount quantity unit starts_on ends_on].freeze
    LABELS = {
      'supplier' => 'Supplier', 'currency' => 'Currency', 'unit_price' => 'Price per unit',
      'discount' => 'Discount (%)', 'quantity' => 'Quantity', 'unit' => 'Unit',
      'starts_on' => 'Starts on', 'ends_on' => 'Ends on'
    }.freeze
    CURRENCIES = { 'CHF'=>2, 'USD'=>2, 'JPY'=>0 }.freeze
    UNITS = %w[hours items].freeze
    SUPPLIERS = { 'northstar'=>'Northstar Services', 'alpine'=>'Alpine Equipment', 'harbor'=>'Harbor Analytics' }.freeze
    attr_accessor(*FIELDS)
    validates :supplier, inclusion: {in: SUPPLIERS.keys}
    validates :currency, inclusion: {in: CURRENCIES.keys}
    validates :unit, inclusion: {in: UNITS}
    validate :business_values

    def initialize(values={})
      super({'supplier'=>'northstar','currency'=>'CHF','unit_price'=>'125.50','discount'=>'7.5','quantity'=>'2.5','unit'=>'hours','starts_on'=>'2030-03-01','ends_on'=>'2030-03-31'}.merge(values.to_h.stringify_keys.slice(*FIELDS)))
    end
    def values = FIELDS.to_h { |field| [field,public_send(field).to_s] }

    def canonical
      decimals=CURRENCIES.fetch(currency)
      price=decimal(unit_price); percent=decimal(discount); qty=decimal(quantity)
      subtotal=(price*qty*(10**decimals)).round(0,BigDecimal::ROUND_HALF_UP).to_i
      discount_minor=(BigDecimal(subtotal.to_s)*percent/100).round(0,BigDecimal::ROUND_HALF_UP).to_i
      {supplier:supplier,currency:currency,unit_price_minor:(price*(10**decimals)).to_i,
       discount_bps:(percent*100).to_i,quantity_milli:(qty*1000).to_i,unit:unit,
       starts_on:starts_on,ends_on:ends_on,days:(Date.iso8601(ends_on)-Date.iso8601(starts_on)).to_i+1,
       subtotal_minor:subtotal,discount_minor:discount_minor,total_minor:subtotal-discount_minor}
    end

    def self.display(field, value)
      return 'Not entered' if value.blank?
      field == 'supplier' ? SUPPLIERS.fetch(value, value) : value
    end

    private

    def decimal(value)
      BigDecimal(value.to_s.tr(',','.'))
    end
    def number(field,scale,min,max)
      raw=public_send(field).to_s
      unless raw.match?(/\A\d+(?:[.,]\d{1,#{[scale,1].max}})?\z/) && (scale.positive? || !raw.match?(/[.,]/)) && raw.length<=16
        errors.add(field,scale.zero? ? 'must be a whole number without grouping or an exponent.' : "must use at most #{scale} decimal places, with a dot or comma and no grouping or exponent.")
        return
      end
      value=decimal(raw)
      errors.add(field,"must be between #{min} and #{max}.") unless value.between?(min,max)
    end
    def business_values
      number(:unit_price,CURRENCIES.fetch(currency,2),BigDecimal('0'),BigDecimal('1000000'))
      number(:discount,2,BigDecimal('0'),BigDecimal('100'))
      number(:quantity,unit=='items' ? 0 : 3,unit=='items' ? BigDecimal('1') : BigDecimal('0.001'),BigDecimal('1000'))
      dates={}
      %i[starts_on ends_on].each do |field|
        raw=public_send(field).to_s
        begin
          raise Date::Error unless raw.match?(/\A\d{4}-\d{2}-\d{2}\z/)
          dates[field]=Date.iso8601(raw)
          raise Date::Error unless dates[field].year.positive?
        rescue Date::Error
          dates.delete(field)
          errors.add(field,'must be a valid calendar date.')
        end
      end
      if dates.size==2
        days=(dates[:ends_on]-dates[:starts_on]).to_i+1
        errors.add(:ends_on,'must be on or after the start date.') if days<1
        errors.add(:ends_on,'must be within a 366-day inclusive period.') if days>366
      end
    end
  end
end
