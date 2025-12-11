import React from 'react';
import cx from 'classnames';

const Avatar = ({ src, size, withBorder, className }) => (
  <div
    className={cx('avatar', className, {
      [size]: true,
      'with-border': withBorder,
    })}
  >
    <img src={src} />
    <style jsx>{`
      .avatar {
        border-radius: 50%;
        overflow: hidden;
      }

      .avatar.small {
        width: 32px;
        height: 32px;
      }

      .avatar.medium {
        width: 48px;
        height: 48px;
      }

      .avatar.big {
        width: 72px;
        height: 72px;
      }

      .avatar.very-big {
        width: 200px;
        height: 200px;
      }

      .avatar.with-border {
        border: 2px solid #fff;
        background: #fff;
      }

      .avatar.with-border.very-big {
        border: 4px solid #fff;
      }

      img {
        width: 100%;
        height: 100%;
      }
    `}</style>
  </div>
);

Avatar.defaultProps = {
  src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&scale=80',
  size: 'medium',
};

export default Avatar;
