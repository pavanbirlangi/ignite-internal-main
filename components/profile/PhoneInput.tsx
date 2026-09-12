'use client'

import { PhoneInput as ReactPhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'

interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    defaultCountry?: string
}

export function PhoneInput({
    value,
    onChange,
    defaultCountry = 'in',
}: PhoneInputProps) {
    return (
        <div className="phone-input-themed">
            <ReactPhoneInput
                defaultCountry={defaultCountry}
                value={value}
                onChange={(phone) => onChange(phone)}
                inputClassName="phone-input-field"
                countrySelectorStyleProps={{
                    buttonClassName: 'phone-country-btn',
                    dropdownStyleProps: {
                        className: 'phone-dropdown',
                        listItemClassName: 'phone-dropdown-item',
                    },
                }}
            />
        </div>
    )
}
