import { SVGProps } from "react";

export function QRCodePlaceholder(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 0H48V48H0V0ZM8 8H40V40H8V8Z"
                fill="black"
            />
            <path d="M16 16H32V32H16V16Z" fill="black" />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M80 0H128V48H80V0ZM88 8H120V40H88V8Z"
                fill="black"
            />
            <path d="M96 16H112V32H96V16Z" fill="black" />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 80H48V128H0V80ZM8 88H40V120H8V88Z"
                fill="black"
            />
            <path d="M16 96H32V112H16V96Z" fill="black" />
            <path d="M72 8H64V16H56V24H72V8Z" fill="black" />
            <path d="M64 32H56V40H72V56H80V48H88V40H96V32H80V24H88V16H80V8H72V24H64V32Z" fill="black" />
            <path d="M120 56H112V64H104V56H96V64H104V72H112V80H120V72H128V64H120V56Z" fill="black" />
            <path d="M56 48H48V72H56V64H64V56H56V48Z" fill="black" />
            <path d="M88 56H80V64H72V72H64V88H56V96H48V104H64V112H56V120H64V128H72V120H80V128H88V112H80V104H72V96H80V88H88V80H96V72H104V88H96V96H88V104H80V112H88V120H96V112H104V120H112V128H120V112H128V104H120V96H112V88H120V80H112V72H120V80H128V72H120V64H112V56H104V48H96V56H88V56Z" fill="black" />
            <path d="M64 64H72V80H64V64Z" fill="black" />
        </svg>
    );
}
