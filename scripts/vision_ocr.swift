import Foundation
import Vision
import ImageIO

// Apple Vision performs local ML text recognition. Python owns validation and parsing.
guard CommandLine.arguments.count == 2 else { exit(2) }
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
request.recognitionLanguages = ["en-US"]
do {
    try VNImageRequestHandler(url: url, options: [:]).perform([request])
    let observations = (request.results ?? []).sorted {
        if abs($0.boundingBox.midY - $1.boundingBox.midY) > 0.012 {
            return $0.boundingBox.midY > $1.boundingBox.midY
        }
        return $0.boundingBox.minX < $1.boundingBox.minX
    }
    let lines: [[String: Any]] = observations.compactMap { observation in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        return ["text": candidate.string, "confidence": candidate.confidence,
                "box": ["x": box.minX, "y": 1 - box.maxY, "width": box.width, "height": box.height]]
    }
    let data = try JSONSerialization.data(withJSONObject: ["lines": lines], options: [.sortedKeys])
    FileHandle.standardOutput.write(data)
} catch {
    let diagnostic = error as NSError
    FileHandle.standardError.write(Data("Local text recognition failed (\(diagnostic.domain), \(diagnostic.code)): \(diagnostic.localizedDescription)\n".utf8))
    exit(1)
}
