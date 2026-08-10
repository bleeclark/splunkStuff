import styled from 'styled-components';

export const Page = styled.main`
    min-height: 100vh;
    box-sizing: border-box;
    padding: 40px clamp(24px, 5vw, 72px) 64px;
    color: #17212b;
    background:
        radial-gradient(circle at 12% 2%, rgba(101, 166, 55, 0.13), transparent 28rem),
        linear-gradient(180deg, #f7f9fb 0%, #edf2f5 100%);
`;

export const Hero = styled.header`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 32px;
    align-items: end;
    max-width: 1180px;
    margin: 0 auto 30px;

    @media (max-width: 760px) {
        grid-template-columns: 1fr;
        gap: 18px;
    }
`;

export const Eyebrow = styled.div`
    margin-bottom: 12px;
    color: #4d6b35;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
`;

export const Title = styled.h1`
    margin: 0;
    max-width: 780px;
    color: #101820;
    font-size: clamp(34px, 5vw, 58px);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 0.98;
`;

export const Intro = styled.p`
    max-width: 760px;
    margin: 18px 0 0;
    color: #53616d;
    font-size: 17px;
    line-height: 1.55;
`;

export const VersionBadge = styled.div`
    min-width: 156px;
    padding: 16px 18px;
    border: 1px solid rgba(23, 33, 43, 0.1);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 12px 32px rgba(31, 47, 61, 0.08);
    color: #53616d;
    font-size: 12px;
    line-height: 1.35;

    strong {
        display: block;
        margin-top: 4px;
        color: #17212b;
        font-size: 22px;
    }
`;

export const Summary = styled.section`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    max-width: 1180px;
    margin: 0 auto 22px;

    @media (max-width: 860px) {
        grid-template-columns: 1fr;
    }
`;

export const SummaryCard = styled.article`
    min-height: 118px;
    padding: 22px;
    border: 1px solid rgba(23, 33, 43, 0.09);
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 14px 35px rgba(31, 47, 61, 0.07);

    h2 {
        margin: 13px 0 7px;
        color: #17212b;
        font-size: 19px;
    }

    p {
        margin: 0;
        color: #61707c;
        font-size: 14px;
        line-height: 1.5;
    }
`;

export const Status = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: ${(props) => props.$color};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    &::before {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${(props) => props.$color};
        box-shadow: 0 0 0 4px ${(props) => `${props.$color}1c`};
        content: '';
    }
`;

export const DetailGrid = styled.section`
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
    gap: 22px;
    max-width: 1180px;
    margin: 0 auto;

    @media (max-width: 940px) {
        grid-template-columns: 1fr;
    }
`;

export const Panel = styled.article`
    overflow: hidden;
    border: 1px solid rgba(23, 33, 43, 0.09);
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 16px 42px rgba(31, 47, 61, 0.08);
`;

export const PanelHeader = styled.div`
    padding: 22px 24px 18px;
    border-bottom: 1px solid #e8edf0;

    h2 {
        margin: 0;
        font-size: 21px;
    }

    p {
        margin: 7px 0 0;
        color: #687783;
        font-size: 14px;
    }
`;

export const CheckList = styled.ul`
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
`;

export const CheckItem = styled.li`
    display: grid;
    grid-template-columns: 30px 1fr;
    gap: 12px;
    padding: 17px 24px;
    border-bottom: 1px solid #eef1f3;

    &:last-child {
        border-bottom: 0;
    }

    span:first-child {
        display: grid;
        width: 26px;
        height: 26px;
        place-items: center;
        border-radius: 8px;
        background: #eef6e9;
        color: #467525;
        font-weight: 800;
    }

    strong {
        display: block;
        margin-bottom: 4px;
        color: #24313b;
        font-size: 14px;
    }

    p {
        margin: 0;
        color: #6a7883;
        font-size: 13px;
        line-height: 1.48;
    }
`;

export const CodeBlock = styled.pre`
    overflow: auto;
    margin: 0;
    padding: 24px;
    background: #111b25;
    color: #e3edf4;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.62;
    white-space: pre-wrap;

    .tag {
        color: #70c1e8;
    }

    .attr {
        color: #bddb86;
    }

    .value {
        color: #f5c26b;
    }
`;

export const Footnote = styled.div`
    padding: 18px 24px;
    border-top: 1px solid #e8edf0;
    background: #fbfcfd;
    color: #5f6f7b;
    font-size: 13px;
    line-height: 1.5;

    code {
        color: #24313b;
        font-weight: 600;
    }
`;
