// packages/components/src/components/select/select.tsx
import {
  FloatingPortal,
  autoUpdate,
  useDismiss,
  useFloating,
  useInteractions
} from "@floating-ui/react";
import { useState } from "react";

// packages/components/src/components/select/select.scss
var css = `.sk-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding: 0 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  height: 20px;
  line-height: 20px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}
.sk-select.sk-select-no-border {
  border: none;
}

.sk-select-suffix-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}

.sk-select-popover {
  padding: 8px 0;
  border: 1px solid #eee;
  border-radius: 4px;
  width: 120px;
  background-color: #fff;
  box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 4px 10px rgba(0, 0, 0, 0.1);
  user-select: none;
}
.sk-select-popover .sk-select-popover-item {
  display: flex;
  align-items: center;
  padding: 0 4px;
  height: 20px;
  line-height: 20px;
  font-size: 14px;
  color: #333;
  text-decoration: none;
  cursor: pointer;
}
.sk-select-popover .sk-select-popover-item .sk-select-popover-item-icon {
  margin-right: 4px;
  font-size: 0;
  line-height: 0;
  width: 20px;
  height: 20px;
}
.sk-select-popover .sk-select-popover-item .sk-select-popover-item-icon svg {
  width: 20px;
  height: 20px;
}
.sk-select-popover .sk-select-popover-item:hover {
  color: #fff;
  background-color: #0f8fff;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL1VzZXJzL3lhbmdkYW4vemYtd29ya3NwYWNlL3JlYWN0L3N1aWthL3BhY2thZ2VzL2NvbXBvbmVudHMvc3JjL2NvbXBvbmVudHMvc2VsZWN0Iiwic291cmNlcyI6WyJzZWxlY3Quc2NzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUNFO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUVBO0VBRUE7RUFDQTs7QUFFQTtFQUNFOzs7QUFJSjtFQUNFO0VBQ0E7RUFDQTs7O0FBR0Y7RUFDRTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFFQTs7QUFFQTtFQUNFO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFjQTs7QUFaQTtFQUNFO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7O0FBQ0E7RUFDRTtFQUNBOztBQUtKO0VBQ0U7RUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi5zay1zZWxlY3Qge1xuICBkaXNwbGF5OiBmbGV4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIHBhZGRpbmc6IDAgOHB4O1xuICBib3JkZXI6IDFweCBzb2xpZCAjZTVlNWU1O1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIGhlaWdodDogMjBweDtcbiAgbGluZS1oZWlnaHQ6IDIwcHg7XG5cbiAgZm9udC1zaXplOiAxNHB4O1xuXG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG5cbiAgJi5zay1zZWxlY3Qtbm8tYm9yZGVyIHtcbiAgICBib3JkZXI6IG5vbmU7XG4gIH1cbn1cblxuLnNrLXNlbGVjdC1zdWZmaXgtaWNvbiB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xufVxuXG4uc2stc2VsZWN0LXBvcG92ZXIge1xuICBwYWRkaW5nOiA4cHggMDtcbiAgYm9yZGVyOiAxcHggc29saWQgI2VlZTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICB3aWR0aDogMTIwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIGJveC1zaGFkb3c6IDBweCAwcHggMHB4IDFweCByZ2JhKDAsIDAsIDAsIDAuMDUpLFxuICAgIDBweCA0cHggMTBweCByZ2JhKDAsIDAsIDAsIDAuMSk7XG4gIHVzZXItc2VsZWN0OiBub25lO1xuXG4gIC5zay1zZWxlY3QtcG9wb3Zlci1pdGVtIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgcGFkZGluZzogMCA0cHg7XG4gICAgaGVpZ2h0OiAyMHB4O1xuICAgIGxpbmUtaGVpZ2h0OiAyMHB4O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBjb2xvcjogIzMzMztcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG5cbiAgICAuc2stc2VsZWN0LXBvcG92ZXItaXRlbS1pY29uIHtcbiAgICAgIG1hcmdpbi1yaWdodDogNHB4O1xuICAgICAgZm9udC1zaXplOiAwO1xuICAgICAgbGluZS1oZWlnaHQ6IDA7XG4gICAgICB3aWR0aDogMjBweDtcbiAgICAgIGhlaWdodDogMjBweDtcbiAgICAgIHN2ZyB7XG4gICAgICAgIHdpZHRoOiAyMHB4O1xuICAgICAgICBoZWlnaHQ6IDIwcHg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICY6aG92ZXIge1xuICAgICAgY29sb3I6ICNmZmY7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGY4ZmZmO1xuICAgIH1cbiAgfVxufVxuIl19 */`;
document.head.appendChild(document.createElement("style")).appendChild(document.createTextNode(css));

// packages/components/src/components/select/select.tsx
import classNames from "classnames";

// packages/icons/src/icons/add-outlined.tsx
import React from "react";
import { jsx } from "react/jsx-runtime";
var AddOutlined = React.memo(() => {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          fillRule: "evenodd",
          clipRule: "evenodd",
          d: "M11 12V17H12V12H17V11H12V6H11V11H6V12H11Z"
        }
      )
    }
  );
});

// packages/icons/src/icons/arrow-down-outlined.tsx
import React2 from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var ArrowDownOutlined = React2.memo(() => {
  return /* @__PURE__ */ jsx2(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx2("path", { d: "M7 10L12 15L17 10", stroke: "#333333" })
    }
  );
});

// packages/icons/src/icons/align/align-left.tsx
import React3 from "react";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var AlignLeft = React3.memo(() => {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      stroke: "currentColor",
      children: [
        /* @__PURE__ */ jsx3("path", { d: "M4 4L4 20" }),
        /* @__PURE__ */ jsx3("line", { x1: "6", y1: "9.5", x2: "18", y2: "9.5", strokeWidth: "3" }),
        /* @__PURE__ */ jsx3("line", { x1: "6", y1: "14.5", x2: "14", y2: "14.5", strokeWidth: "3" })
      ]
    }
  );
});

// packages/icons/src/icons/align/align-right.tsx
import React4 from "react";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var AlignRight = React4.memo(() => {
  return /* @__PURE__ */ jsxs2(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx4("path", { d: "M20 4L20 20" }),
        /* @__PURE__ */ jsx4("line", { x1: "6", y1: "9.5", x2: "18", y2: "9.5", strokeWidth: "3" }),
        /* @__PURE__ */ jsx4("line", { x1: "10", y1: "14.5", x2: "18", y2: "14.5", strokeWidth: "3" })
      ]
    }
  );
});

// packages/icons/src/icons/align/align-top.tsx
import React5 from "react";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var AlignTop = React5.memo(() => {
  return /* @__PURE__ */ jsxs3(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx5("path", { d: "M3 5L19 5" }),
        /* @__PURE__ */ jsx5(
          "line",
          {
            y1: "-1.5",
            x2: "12",
            y2: "-1.5",
            transform: "matrix(4.37114e-08 1 1 -4.37114e-08 10 7)",
            strokeWidth: "3"
          }
        ),
        /* @__PURE__ */ jsx5("line", { x1: "13.5", y1: "7", x2: "13.5", y2: "15", strokeWidth: "3" })
      ]
    }
  );
});

// packages/icons/src/icons/align/align-bottom.tsx
import React6 from "react";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
var IconAlignBottom = React6.memo(() => {
  return /* @__PURE__ */ jsxs4(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx6("path", { d: "M5 19L21 19" }),
        /* @__PURE__ */ jsx6(
          "line",
          {
            y1: "-1.5",
            x2: "12",
            y2: "-1.5",
            transform: "matrix(4.37114e-08 1 1 -4.37114e-08 12 5)",
            strokeWidth: "3"
          }
        ),
        /* @__PURE__ */ jsx6("path", { d: "M15.5 9L15.5 17", strokeWidth: "3" })
      ]
    }
  );
});

// packages/icons/src/icons/align/align-h-center.tsx
import React7 from "react";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
var AlignHCenter = React7.memo(() => {
  return /* @__PURE__ */ jsxs5(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx7("path", { d: "M12 4L12 20" }),
        /* @__PURE__ */ jsx7("line", { x1: "6", y1: "9.5", x2: "18", y2: "9.5", strokeWidth: "3" }),
        /* @__PURE__ */ jsx7("line", { x1: "8", y1: "14.5", x2: "16", y2: "14.5", strokeWidth: "3" })
      ]
    }
  );
});

// packages/icons/src/icons/align/align-v-center.tsx
import React8 from "react";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
var AlignVCenter = React8.memo(() => {
  return /* @__PURE__ */ jsxs6(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx8("path", { d: "M4 12L20 12" }),
        /* @__PURE__ */ jsx8("line", { x1: "9.5", y1: "18", x2: "9.5", y2: "6", strokeWidth: "3" }),
        /* @__PURE__ */ jsx8("path", { d: "M14.5 16L14.5 8", strokeWidth: "3" })
      ]
    }
  );
});

// packages/icons/src/icons/i18n-outlined.tsx
import React9 from "react";
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
var I18nOutlined = React9.memo(() => {
  return /* @__PURE__ */ jsxs7(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx9("line", { x1: "5", y1: "5.5", x2: "15", y2: "5.5", stroke: "#333333" }),
        /* @__PURE__ */ jsx9("line", { x1: "10", y1: "4", x2: "10", y2: "5", stroke: "#333333" }),
        /* @__PURE__ */ jsx9(
          "line",
          {
            x1: "13.3947",
            y1: "5.30697",
            x2: "6.39468",
            y2: "14.307",
            stroke: "#333333"
          }
        ),
        /* @__PURE__ */ jsx9(
          "line",
          {
            x1: "7.35355",
            y1: "6.64645",
            x2: "12.3536",
            y2: "11.6464",
            stroke: "#333333"
          }
        ),
        /* @__PURE__ */ jsx9(
          "path",
          {
            d: "M11.5 18L15.5629 9.75718L19.5 18",
            stroke: "#333333",
            strokeLinejoin: "bevel"
          }
        ),
        /* @__PURE__ */ jsx9("line", { x1: "13", y1: "14.2098", x2: "18", y2: "14.2098", stroke: "#333333" })
      ]
    }
  );
});

// packages/icons/src/icons/close-outlined.tsx
import React10 from "react";
import { jsx as jsx10 } from "react/jsx-runtime";
var CloseOutlined = React10.memo(() => {
  return /* @__PURE__ */ jsx10(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx10("path", { d: "M7 7L17 17M7 17L17 7", stroke: "#333333" })
    }
  );
});

// packages/icons/src/icons/tool/rect-outlined.tsx
import React11 from "react";
import { jsx as jsx11 } from "react/jsx-runtime";
var RectOutlined = React11.memo(() => {
  return /* @__PURE__ */ jsx11(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx11("rect", { x: "4.5", y: "6.5", width: "16", height: "11", rx: "0.5" })
    }
  );
});

// packages/icons/src/icons/tool/ellipse-outlined.tsx
import React12 from "react";
import { jsx as jsx12 } from "react/jsx-runtime";
var EllipseOutlined = React12.memo(() => {
  return /* @__PURE__ */ jsx12(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx12("circle", { cx: "12", cy: "12", r: "7.5" })
    }
  );
});

// packages/icons/src/icons/tool/select-outlined.tsx
import React13 from "react";
import { jsx as jsx13 } from "react/jsx-runtime";
var SelectOutlined = React13.memo(() => {
  return /* @__PURE__ */ jsx13(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx13("path", { d: "M7.51055 4.42553L7.73603 3.97926L7.01138 3.61312L7.01055 4.42501L7.51055 4.42553ZM19.303 10.3838L19.5647 10.8098L20.3274 10.3412L19.5285 9.93753L19.303 10.3838ZM7.49703 17.6377L6.99703 17.6372L6.99612 18.5323L7.75878 18.0637L7.49703 17.6377ZM11.6438 15.0899L12.0698 14.8281L11.808 14.4021L11.382 14.6638L11.6438 15.0899ZM14.2173 19.2784L13.7913 19.5402L14.0531 19.9662L14.4791 19.7044L14.2173 19.2784ZM17.6254 17.1844L17.8872 17.6104L18.3132 17.3486L18.0514 16.9226L17.6254 17.1844ZM15.0518 12.9958L14.7901 12.5698L14.3641 12.8316L14.6258 13.2576L15.0518 12.9958ZM7.28507 4.8718L19.0775 10.8301L19.5285 9.93753L7.73603 3.97926L7.28507 4.8718ZM7.99703 17.6382L8.01055 4.42604L7.01055 4.42501L6.99703 17.6372L7.99703 17.6382ZM11.382 14.6638L7.23528 17.2117L7.75878 18.0637L11.9055 15.5159L11.382 14.6638ZM14.6434 19.0167L12.0698 14.8281L11.2178 15.3516L13.7913 19.5402L14.6434 19.0167ZM17.3637 16.7584L13.9556 18.8524L14.4791 19.7044L17.8872 17.6104L17.3637 16.7584ZM14.6258 13.2576L17.1994 17.4461L18.0514 16.9226L15.4779 12.7341L14.6258 13.2576ZM19.0412 9.95779L14.7901 12.5698L15.3136 13.4218L19.5647 10.8098L19.0412 9.95779Z" })
    }
  );
});

// packages/icons/src/icons/tool/hand-outlined.tsx
import React14 from "react";
import { jsx as jsx14 } from "react/jsx-runtime";
var HandOutlined = React14.memo(() => {
  return /* @__PURE__ */ jsx14(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx14("path", { d: "M18.7717 7.39806H17.7548C17.5361 7.39806 17.3568 7.56657 17.3568 7.7767V11.3197H16.6395V6.01456C16.6395 5.55479 16.248 5.18239 15.7647 5.18239H14.8943C14.6712 5.18239 14.4876 5.35506 14.4876 5.56935V11.3197H13.7703V4.89528C13.7703 4.67684 13.5844 4.5 13.3547 4.5H12.4078C11.9726 4.5 11.6205 4.83495 11.6205 5.24896V11.3176H10.9032V6.4785C10.9032 6.23301 10.4364 6.01456 10.1784 6.01456L9.53862 6.03329C9.10343 6.03329 8.75352 6.36824 8.75352 6.78017V15.7698L5.939 13.8495C5.53005 13.5915 4.97676 13.7309 4.75589 14.1491C4.75589 14.1491 4.58968 14.4695 4.53064 14.5756C4.47378 14.6817 4.50221 14.7816 4.56563 14.8523C4.6203 14.9126 7.42171 18.0333 8.34895 19.0527C8.61794 19.3481 9.12092 19.5 9.55393 19.5H18.085C18.8679 19.5 19.384 18.8967 19.384 18.154L19.4999 11.3197V8.09709C19.5065 7.71013 19.1784 7.39806 18.7717 7.39806Z" })
    }
  );
});

// packages/icons/src/icons/tool/text-filled.tsx
import React15 from "react";
import { jsx as jsx15, jsxs as jsxs8 } from "react/jsx-runtime";
var TextFilled = React15.memo(() => {
  return /* @__PURE__ */ jsxs8(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx15("rect", { x: "11", y: "4", width: "1", height: "16" }),
        /* @__PURE__ */ jsx15("rect", { x: "5", y: "4", width: "13", height: "1" }),
        /* @__PURE__ */ jsx15("rect", { x: "5", y: "5", width: "1", height: "3" }),
        /* @__PURE__ */ jsx15("rect", { x: "17", y: "5", width: "1", height: "3" }),
        /* @__PURE__ */ jsx15("rect", { x: "8", y: "19", width: "7", height: "1" })
      ]
    }
  );
});

// packages/icons/src/icons/tool/line-outlined.tsx
import React16 from "react";
import { jsx as jsx16 } from "react/jsx-runtime";
var LineOutlined = React16.memo(() => {
  return /* @__PURE__ */ jsx16(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx16(
        "path",
        {
          fillRule: "evenodd",
          clipRule: "evenodd",
          d: "M19.3915 5.35404L5.35308 19.354L4.64694 18.646L18.6853 4.64597L19.3915 5.35404Z"
        }
      )
    }
  );
});

// packages/icons/src/icons/check-outlined.tsx
import React17 from "react";
import { jsx as jsx17 } from "react/jsx-runtime";
var CheckOutlined = React17.memo(() => {
  return /* @__PURE__ */ jsx17(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx17("path", { d: "M8 12L11 16L18 7" })
    }
  );
});

// packages/icons/src/icons/social/github-outlined.tsx
import React18 from "react";
import { jsx as jsx18 } from "react/jsx-runtime";
var GithubOutlined = React18.memo(() => {
  return /* @__PURE__ */ jsx18(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 16 16",
      fill: "currentColor",
      children: /* @__PURE__ */ jsx18(
        "path",
        {
          fillRule: "evenodd",
          transform: "translate(0.25 0.25)  rotate(0 7.75 7.556366182551985)",
          d: "M5.00688 12.0551C4.91688 12.0551 4.84688 12.1051 4.84688 12.1651C4.84688 12.2451 4.91688 12.2951 5.01688 12.2851C5.11688 12.2851 5.18688 12.2351 5.18688 12.1651C5.18688 12.0951 5.10688 12.0451 5.00688 12.0551Z M4.34812 12.1793C4.42812 12.2093 4.51812 12.1793 4.53812 12.1193C4.55812 12.0593 4.49812 11.9893 4.40812 11.9593C4.32812 11.9393 4.23812 11.9693 4.20812 12.0293C4.18812 12.0893 4.25812 12.1593 4.34812 12.1793Z M5.44907 12.1237C5.45907 12.1937 5.53907 12.2337 5.63907 12.2137C5.72907 12.1837 5.78907 12.1237 5.77907 12.0637C5.76907 12.0037 5.68907 11.9637 5.58907 11.9737C5.49907 11.9937 5.43907 12.0537 5.44907 12.1237Z M7.65 0C3.32 0 0 3.29 0 7.63C0 11.09 2.18 14.06 5.3 15.1C5.7 15.17 5.84 14.93 5.84 14.72C5.84 14.53 5.83 13.46 5.83 12.8C5.83 12.8 3.64 13.27 3.18 11.87C3.18 11.87 2.83 10.96 2.31 10.73C2.31 10.73 1.6 10.24 2.36 10.25C2.36 10.25 3.14 10.31 3.57 11.05C4.25 12.26 5.4 11.91 5.85 11.71C5.92 11.21 6.12 10.86 6.35 10.65C4.6 10.46 2.84 10.21 2.84 7.2C2.84 6.34 3.08 5.91 3.58 5.36C3.49 5.16 3.23 4.32 3.66 3.24C4.31 3.03 5.81 4.08 5.81 4.08C6.44 3.91 7.11 3.82 7.78 3.82C8.44 3.82 9.11 3.91 9.74 4.08C9.74 4.08 11.24 3.03 11.89 3.24C12.32 4.32 12.06 5.16 11.98 5.36C12.48 5.91 12.78 6.34 12.78 7.2C12.78 10.22 10.94 10.46 9.19 10.65C9.48 10.9 9.73 11.37 9.73 12.1C9.73 13.16 9.72 14.46 9.72 14.72C9.72 14.92 9.86 15.17 10.26 15.09C13.38 14.06 15.5 11.09 15.5 7.63C15.5 3.29 11.98 0 7.65 0Z M3.06231 10.9369C3.11231 10.9869 3.18231 11.0169 3.22231 10.9669C3.26231 10.9369 3.25231 10.8669 3.20231 10.8069C3.15231 10.7569 3.08231 10.7369 3.04231 10.7769C2.99231 10.8069 3.00231 10.8769 3.06231 10.9369Z M2.77304 10.6435C2.82304 10.6735 2.88304 10.6735 2.90304 10.6235C2.93304 10.5835 2.89304 10.5335 2.83304 10.5035C2.77304 10.4835 2.72304 10.4935 2.70304 10.5235C2.68304 10.5635 2.71304 10.6135 2.77304 10.6435Z M3.75443 11.8362C3.82443 11.9062 3.91443 11.9162 3.95443 11.8662C3.99443 11.8262 3.97443 11.7262 3.91443 11.6662C3.84443 11.5962 3.75443 11.5862 3.71443 11.6362C3.66443 11.6762 3.68443 11.7762 3.75443 11.8362Z M3.35875 11.3601C3.40875 11.4301 3.48875 11.4701 3.52875 11.4301C3.57875 11.3901 3.57875 11.3101 3.52875 11.2401C3.48875 11.1701 3.40875 11.1401 3.35875 11.1801C3.30875 11.2101 3.30875 11.2901 3.35875 11.3601Z "
        }
      )
    }
  );
});

// packages/icons/src/icons/remove-outlined.tsx
import React19 from "react";
import { jsx as jsx19 } from "react/jsx-runtime";
var RemoveOutlined = React19.memo(() => {
  return /* @__PURE__ */ jsx19(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx19("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M17 12H6V11H17V12Z" })
    }
  );
});

// packages/icons/src/icons/line-width-outlined.tsx
import React20 from "react";
import { jsx as jsx20, jsxs as jsxs9 } from "react/jsx-runtime";
var LineWidthOutlined = React20.memo(() => {
  return /* @__PURE__ */ jsxs9(
    "svg",
    {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx20("line", { x1: "4", y1: "6.5", x2: "20", y2: "6.5" }),
        /* @__PURE__ */ jsx20("line", { x1: "4", y1: "16", x2: "20", y2: "16", strokeWidth: "4" }),
        /* @__PURE__ */ jsx20("line", { x1: "4", y1: "10.5", x2: "20", y2: "10.5", strokeWidth: "3" })
      ]
    }
  );
});

// packages/components/src/components/select/select.tsx
import { Fragment, jsx as jsx21, jsxs as jsxs10 } from "react/jsx-runtime";
var Select = ({
  value,
  options = [],
  bordered = true,
  style,
  dropdownWidth,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { x, y, strategy, refs, context } = useFloating({
    placement: "bottom-start",
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate
  });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);
  const activeLabel = options.find((option) => option.value === value)?.label ?? "";
  const handleChange = (value2) => {
    onSelect && onSelect(value2);
    setIsOpen(false);
  };
  return /* @__PURE__ */ jsxs10(Fragment, { children: [
    /* @__PURE__ */ jsxs10(
      "div",
      {
        style,
        className: classNames("sk-select", {
          "sk-select-no-border": !bordered
        }),
        ref: refs.setReference,
        onClick: () => setIsOpen(!isOpen),
        ...getReferenceProps(),
        children: [
          activeLabel,
          /* @__PURE__ */ jsx21("span", { className: "sk-select-suffix-icon", children: /* @__PURE__ */ jsx21(ArrowDownOutlined, {}) })
        ]
      }
    ),
    /* @__PURE__ */ jsx21(FloatingPortal, { children: isOpen && /* @__PURE__ */ jsx21(
      "div",
      {
        ref: refs.setFloating,
        className: "sk-select-popover",
        style: {
          position: strategy,
          top: y ?? 0,
          left: x ?? 0,
          width: dropdownWidth
        },
        ...getFloatingProps(),
        children: options.map((option) => /* @__PURE__ */ jsxs10(
          "div",
          {
            className: "sk-select-popover-item",
            onClick: () => handleChange(option.value),
            children: [
              /* @__PURE__ */ jsx21("span", { className: "sk-select-popover-item-icon", children: option.value === value && /* @__PURE__ */ jsx21(CheckOutlined, {}) }),
              option.label
            ]
          },
          option.label
        ))
      }
    ) })
  ] });
};

// packages/components/src/components/popover/popover.scss
var css2 = `.sk-popover-content {
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 10px 24px rgba(0, 0, 0, 0.18), 0px 2px 5px rgba(0, 0, 0, 0.15), 0px 2px 14px rgba(0, 0, 0, 0.15), 0px 0px 0px 0.5px rgba(0, 0, 0, 0.2);
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL1VzZXJzL3lhbmdkYW4vemYtd29ya3NwYWNlL3JlYWN0L3N1aWthL3BhY2thZ2VzL2NvbXBvbmVudHMvc3JjL2NvbXBvbmVudHMvcG9wb3ZlciIsInNvdXJjZXMiOlsicG9wb3Zlci5zY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQ0U7RUFDQTtFQUVBIiwic291cmNlc0NvbnRlbnQiOlsiLnNrLXBvcG92ZXItY29udGVudCB7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcblxuICBib3gtc2hhZG93OiAwcHggMHB4IDFweCByZ2JhKDAsIDAsIDAsIDAuMDgpLCAwcHggMTBweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xOCksXG4gICAgMHB4IDJweCA1cHggcmdiYSgwLCAwLCAwLCAwLjE1KSwgMHB4IDJweCAxNHB4IHJnYmEoMCwgMCwgMCwgMC4xNSksXG4gICAgMHB4IDBweCAwcHggMC41cHggcmdiYSgwLCAwLCAwLCAwLjIpO1xufVxuIl19 */`;
document.head.appendChild(document.createElement("style")).appendChild(document.createTextNode(css2));

// packages/components/src/components/popover/popover.tsx
import {
  FloatingPortal as FloatingPortal2,
  autoUpdate as autoUpdate2,
  flip,
  offset as floatUiOffset,
  useClick,
  useDismiss as useDismiss2,
  useFloating as useFloating2,
  useInteractions as useInteractions2
} from "@floating-ui/react";
import { Fragment as Fragment2, jsx as jsx22, jsxs as jsxs11 } from "react/jsx-runtime";
var Popover = ({
  placement = "bottom",
  content,
  children,
  offset = 5,
  open,
  onOpenChange
}) => {
  const { x, y, strategy, refs, context } = useFloating2({
    placement,
    open,
    onOpenChange,
    whileElementsMounted: autoUpdate2,
    middleware: [
      flip({
        fallbackAxisSideDirection: "end"
      }),
      floatUiOffset(offset)
    ]
  });
  const click = useClick(context, { event: "mousedown" });
  const dismiss = useDismiss2(context);
  const { getReferenceProps, getFloatingProps } = useInteractions2([
    click,
    dismiss
  ]);
  return /* @__PURE__ */ jsxs11(Fragment2, { children: [
    /* @__PURE__ */ jsx22("span", { ref: refs.setReference, ...getReferenceProps(), children }),
    /* @__PURE__ */ jsx22(FloatingPortal2, { children: open && /* @__PURE__ */ jsx22(
      "div",
      {
        ref: refs.setFloating,
        className: "sk-popover-content",
        style: {
          position: strategy,
          left: x ?? 0,
          top: y ?? 0
        },
        ...getFloatingProps(),
        children: content
      }
    ) })
  ] });
};

// packages/components/src/components/icon-button/icon-button.scss
var css3 = `.sk-icon-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  color: #191919;
}
.sk-icon-btn:hover {
  background-color: #f5f5f5;
}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VSb290IjoiL1VzZXJzL3lhbmdkYW4vemYtd29ya3NwYWNlL3JlYWN0L3N1aWthL3BhY2thZ2VzL2NvbXBvbmVudHMvc3JjL2NvbXBvbmVudHMvaWNvbi1idXR0b24iLCJzb3VyY2VzIjpbImljb24tYnV0dG9uLnNjc3MiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFDRTtFQUNBO0VBQ0E7RUFFQTtFQUNBO0VBQ0E7RUFDQTs7QUFFQTtFQUNFIiwic291cmNlc0NvbnRlbnQiOlsiLnNrLWljb24tYnRuIHtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICB3aWR0aDogMjRweDtcbiAgaGVpZ2h0OiAyNHB4O1xuICBjb2xvcjogIzE5MTkxOTtcblxuICAmOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjVmNWY1O1xuICB9XG59XG4iXX0= */`;
document.head.appendChild(document.createElement("style")).appendChild(document.createTextNode(css3));

// packages/components/src/components/icon-button/icon-button.tsx
import { jsx as jsx23 } from "react/jsx-runtime";
var IconButton = ({ children, onClick }) => {
  return /* @__PURE__ */ jsx23("div", { className: "sk-icon-btn", onClick: () => onClick(), children });
};
export {
  IconButton,
  Popover,
  Select
};
//# sourceMappingURL=components.es.js.map
