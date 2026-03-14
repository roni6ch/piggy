'use client';

import Image from 'next/image';
import {
  VisaFlatRoundedIcon,
  MastercardFlatRoundedIcon,
  AmericanExpressFlatRoundedIcon,
  DinersClubFlatRoundedIcon,
} from 'react-svg-credit-card-payment-icons';
import { Provider } from '../types';

const iconSize = 50;

const style = { display: 'block', flexShrink: 0 };

type PaymentNetworkIconProps = {
  provider: Provider;
  width?: number;
  height?: number;
  className?: string;
  ariaHidden?: boolean;
};

/**
 * Renders the payment network logo (Visa, Mastercard, Amex, Diners) using
 * react-svg-credit-card-payment-icons. BIT uses the local asset.
 */
export default function PaymentNetworkIcon({
  provider,
  width = iconSize,
  height = iconSize,
  className,
  ariaHidden,
}: PaymentNetworkIconProps) {
  const props = {
    width,
    height,
    style,
    ...(className && { className }),
    ...(ariaHidden && { 'aria-hidden': true }),
  };

  switch (provider) {
    case Provider.VISA:
      return <VisaFlatRoundedIcon {...props} />;
    case Provider.MASTERCARD:
      return <MastercardFlatRoundedIcon {...props} />;
    case Provider.AMEX:
      return <AmericanExpressFlatRoundedIcon {...props} />;
    case Provider.DINERS:
      return <DinersClubFlatRoundedIcon {...props} />;
    case Provider.BIT:
      return (
        <Image
          src="/assets/cards-icons/bit.svg"
          width={width}
          height={height}
          className={className}
          alt="BIT logo"
          aria-hidden={ariaHidden}
        />
      );
    default:
      return null;
  }
}
