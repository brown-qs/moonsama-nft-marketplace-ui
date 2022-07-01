import Button from '@mui/material/Button/Button';
import { ExternalLink } from 'components/ExternalLink/ExternalLink';
import { useClasses } from 'hooks';
import React from 'react';
import { styles as style } from './OptionCard.styles';

export default function OptionCard({
  link = null,
  onClick = null,
  header,
  color,
  subheader = null,
  icon,
  active = false,
  id,
}: {
  link?: string | null;
  clickable?: boolean;
  size?: number | null;
  onClick?: null | (() => void);
  color: string;
  header: React.ReactNode;
  subheader: React.ReactNode | null;
  icon: string;
  active?: boolean;
  id: string;
}) {
  console.log({ icon });
  const styles = useClasses(style);
  const content = (
    <div className={styles.optionElementContainer}>
      <div className={styles.optionCardLeft}>
        <div className={styles.headertext}>
          {active ? (
            <div className={styles.circleWrapper}>
              <div className={styles.greenCircle}>
                <div />
              </div>
            </div>
          ) : (
            ''
          )}
          {header}
        </div>
        {subheader && <div className={styles.subheader}>{subheader}</div>}
      </div>

      <div className={styles.iconWrapper}>
        <img className={styles.icon} src={icon} alt={'Icon'} />
      </div>
    </div>
  );
  if (link) {
    return <ExternalLink href={link}>{content}</ExternalLink>;
  }

  return (
    <Button
      variant="outlined"
      style={{ color }}
      id={id}
      onClick={() => onClick?.()}
    >
      {content}
    </Button>
  );
}
