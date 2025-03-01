'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import {
  motion,
  MotionProps,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import React, { PropsWithChildren, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  direction?: 'top' | 'middle' | 'bottom';
  children: React.ReactNode;
}

const DEFAULT_SIZE = 48;
const DEFAULT_MAGNIFICATION = 72;
const DEFAULT_DISTANCE = 120;

const dockVariants = cva(
  'supports-backdrop-blur:bg-white/95 supports-backdrop-blur:dark:bg-black/95 mx-auto flex h-16 items-end justify-center gap-1 rounded-[24px] border border-white/10 px-2 pb-2.5 backdrop-blur-lg transition-all',
  {
    variants: {
      direction: {
        top: 'items-start pt-2.5',
        middle: 'items-center py-2.5',
        bottom: 'items-end pb-2.5',
      },
    },
    defaultVariants: {
      direction: 'bottom',
    },
  },
);

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      direction = 'bottom',
      ...props
    },
    ref,
  ) => {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () => {
      return React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === DockIcon) {
          return React.cloneElement(
            child as React.ReactElement<DockIconProps>,
            {
              ...(typeof child.props === 'object' ? child.props : {}),
              mouseX,
              size: iconSize,
              magnification: iconMagnification,
              distance: iconDistance,
            },
          );
        }
        return child;
      });
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={e => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ direction, className }), 'shadow-dock')}
      >
        {renderChildren()}
      </motion.div>
    );
  },
);

Dock.displayName = 'Dock';

export interface DockIconProps
  extends Omit<MotionProps & React.HTMLAttributes<HTMLDivElement>, 'children'> {
  mouseX?: MotionValue<number>;
  size?: number;
  magnification?: number;
  distance?: number;
  className?: string;
  children?: React.ReactNode;
  props?: PropsWithChildren;
}

// ... imports anteriores permanecem iguais

const DockIcon = ({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  ...props
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const defaultMouseX = useMotionValue(Infinity);
  const isPressed = useRef(false);

  const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val: number) => {
    if (isPressed.current) return 0; // Ignora movimento durante clique
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size],
  );

  const scaleSize = useSpring(sizeTransform, {
    mass: 0.001, // Reduzido para resposta mais rápida
    stiffness: 6500, // Aumentado para resposta mais rápida
    damping: 20, // Reduzido para menos "borrachudo"
  });

  const tapScale = useTransform(scaleSize, s => s * 0.9); // Efeito de pressionar

  return (
    <motion.div
      ref={ref}
      style={{
        width: scaleSize,
        height: scaleSize,
        padding: Math.max(6, size * 0.15),
        scale: isPressed.current ? 0.9 : 1, // Efeito de clique
      }}
      className={cn(
        'flex aspect-square cursor-pointer items-center justify-center rounded-xl',
        'bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20',
        'border border-white/5 hover:border-white/10',
        'shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)]',
        'active:scale-90 active:bg-white/30 active:shadow-inner', // Feedback de clique
        className,
      )}
      whileTap={{
        scale: 0.25,
        transition: { duration: 0.001 },
      }}
      onMouseDown={() => {
        isPressed.current = true;
        scaleSize.set(size * 0.9); // Força redimensionamento imediato
      }}
      onMouseUp={() => {
        isPressed.current = false;
        scaleSize.set(sizeTransform.get()); // Volta ao normal
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

DockIcon.displayName = 'DockIcon';

export { Dock, DockIcon };
