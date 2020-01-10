import Block from "../../models/block";
import {BoardHeight, BoardWidth, wrapper} from "./index";

export let blockSize = 0;
let noticeCount: [number, number] = [0, 0];
const game = document.createElement("canvas");
const context = game.getContext("2d")!;
const effect = document.createElement("canvas");
const effectContext = effect.getContext("2d")!;

export function resize() {
    const clientHeight = wrapper.clientHeight;
    const clientWidth = wrapper.clientWidth;

    if (clientHeight * BoardWidth > clientWidth * BoardHeight) {
        blockSize = Math.floor(clientWidth / BoardWidth);
    } else {
        blockSize = Math.floor(clientHeight / BoardHeight);
    }

    const height = blockSize * BoardHeight;
    const width = blockSize * BoardWidth;

    game.setAttribute("height", String(height));
    game.setAttribute("width", String(width));
    effect.setAttribute("height", String(height));
    effect.setAttribute("width", String(width));

    wrapper.setAttribute("style", `height: ${height}px; width: ${width}px;`);
}

export function init() {
    wrapper.appendChild(game);
    wrapper.appendChild(effect);
    const loop = () => {
        drawEffect();
        requestAnimationFrame(loop);
    };
    loop();
    resize();
}

export function drawBlock(x: number, y: number, block: Block, alpha: number) {
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255, 255, 255, " + String(Math.min(1, alpha)) + ")";

    if (block === Block.Block) {
        context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
    }

    if (block === Block.Bomb) {
        context.beginPath();
        context.arc(x * blockSize + blockSize / 2, y * blockSize + blockSize / 2, blockSize / 2, 0, Math.PI * 2);
        context.stroke();
    }
}

function drawNotice() {
    context.fillStyle = "#FFFFFF";
    for (let i = 0; i < BoardWidth && i < noticeCount[0] + noticeCount[1]; i++) {
        if (i === noticeCount[0]) {
            context.fillStyle = "#888888";
        }
        context.fillRect((i + 0.05) * blockSize, 0.1 * blockSize, 0.9 * blockSize, 0.3 * blockSize);
    }
}

export function clear() {
    context.clearRect(0, 0, blockSize * BoardWidth, blockSize * BoardHeight);
    drawNotice();
}

export function notice(next: number, nextNext: number) {
    noticeCount = [next, nextNext];
    drawNotice();
}

type Effect = {
    positionX: number,
    positionY: number,
    period: number,
    red: number,
    green: number,
    blue: number
};

let effects: Effect[] = [];

export function addEffect(x: number, y: number, delay: number, red: number, green: number, blue: number) {
    effects.push({
        positionX: x * blockSize + blockSize / 2,
        positionY: y * blockSize + blockSize / 2,
        period: -delay,
        red, green, blue
    });
}

function drawEffect() {
    const effectPeriod = 20;
    effects = effects
                .map((effect) => {
                    effect.period++;
                    return effect;
                })
                .filter((effect) => effect.period < effectPeriod);

    effectContext.clearRect(0, 0, blockSize * BoardWidth, blockSize * BoardHeight);
    for (const effect of effects) {
        if (effect.period < 0) {
            continue;
        }

        const radius = effect.period / effectPeriod * blockSize * 2;
        const opacity = Math.max(1 - effect.period / effectPeriod, 0);
        effectContext.beginPath();
        effectContext.strokeStyle = `rgba(${effect.red}, ${effect.green}, ${effect.blue}, ${opacity})`;
        effectContext.arc(effect.positionX, effect.positionY, radius, 0, Math.PI * 2);
        effectContext.stroke();
    }
}
