import React, { useEffect, useRef } from 'react';

export default function AudioVisualizer({ stream, isRecording }) {
    const canvasRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    useEffect(() => {
        if (!isRecording || !stream) {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            return;
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sourceNode = audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();

        analyserNode.fftSize = 64;
        analyserNode.smoothingTimeConstant = 0.8;
        sourceNode.connect(analyserNode);

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Warm pastel butter & soft amber palette
        const barColor = '#d97706';

        const draw = () => {
            animationFrameIdRef.current = requestAnimationFrame(draw);
            analyserNode.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const numBars = 4;
            const barWidth = 7;
            const gap = 8;
            const totalWidth = numBars * barWidth + (numBars - 1) * gap;
            let startX = (canvas.width - totalWidth) / 2;
            const centerY = canvas.height / 2;

            for (let i = 0; i < numBars; i++) {
                const binIndex = Math.min(i * 3 + 2, bufferLength - 1);
                const amplitude = dataArray[binIndex] / 255;

                const minHeight = 8;
                const maxHeight = 34;
                const barHeight = minHeight + amplitude * (maxHeight - minHeight);

                ctx.fillStyle = barColor;
                ctx.beginPath();
                ctx.roundRect(
                    startX,
                    centerY - barHeight / 2,
                    barWidth,
                    barHeight,
                    barWidth / 2
                );
                ctx.fill();

                startX += barWidth + gap;
            }
        };

        draw();

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
        };
    }, [isRecording, stream]);

    if (!isRecording) return null;

    return (
        <div className="voice-modulator-wrapper">
            <canvas
                ref={canvasRef}
                width="120"
                height="46"
                className="voice-modulator-canvas"
            />
        </div>
    );
}