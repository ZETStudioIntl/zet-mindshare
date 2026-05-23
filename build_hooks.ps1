$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$base = "c:\Users\Muhammed Bahaddin\.vscode\zet-mindshare\frontend\src"
$editorPath = "$base\pages\Editor.js"

$pl = [System.IO.File]::ReadAllLines($editorPath)
Write-Host "Editor.js read: $($pl.Count) lines"

$result = [System.Collections.Generic.List[string]]::new()

# 0..47: imports up to and including useCollaboration
$pl[0..47] | ForEach-Object { $result.Add($_) }
# 3 new hook imports
$result.Add("import { useSignature } from '../hooks/useSignature';")
$result.Add("import { useLayerOps } from '../hooks/useLayerOps';")
$result.Add("import { useVoice } from '../hooks/useVoice';")
# 48..244: blank line through // Voice state comment
$pl[48..244] | ForEach-Object { $result.Add($_) }
# Skip 245..253: 9 TTS state declarations (isPlaying through audioRef)
# 254..260: blank + // Panel visibility + showImageUpload..showFont
$pl[254..260] | ForEach-Object { $result.Add($_) }
# Skip 261: showVoice
# 262..278: showColor through showPhotoEdit
$pl[262..278] | ForEach-Object { $result.Add($_) }
# Skip 279: showSignature
# 280..295: uploadForShape through // Signature state comment
$pl[280..295] | ForEach-Object { $result.Add($_) }
# Skip 296..299: 4 signature state declarations
# 300..490: remaining states through // Copy/Paste state comment
$pl[300..490] | ForEach-Object { $result.Add($_) }
# Skip 491: clipboard declaration
# 492..496: blank + // Mirror state + showMirror + mirrorAngle + blank
$pl[492..496] | ForEach-Object { $result.Add($_) }
# Skip 497..505: // Voice Input (STT) state comment + 8 STT state declarations
# 506..521: // Find & Replace state through handleRedo
$pl[506..521] | ForEach-Object { $result.Add($_) }
# INSERT custom hook calls
$result.Add("  // === CUSTOM HOOKS ===")
$result.Add("  const { signatureData, setSignatureData, signatureCanvasRef, isDrawingSignature, setIsDrawingSignature, signaturePoints, setSignaturePoints, showSignature, setShowSignature, clearSignature, handleSignatureMouseDown, handleSignatureMouseMove, handleSignatureMouseUp, addSignatureToCanvas, handleSignaturePhotoUpload } = useSignature({ canvasElements, setCanvasElements, handleSaveHistory, currentColor });")
$result.Add("  const { moveLayerUp, moveLayerDown, toggleLayerVisibility, toggleLayerLock, copyElement, pasteElement, alignElements, mirrorElement, rotateElement, copyElementById, mirrorElementById } = useLayerOps({ canvasElements, setCanvasElements, history, handleSaveHistory, selectedElement, selectedElements, setSelectedElement, setSelectedElements, setShowMirror });")
$result.Add("  const { isPlaying, setIsPlaying, voiceProgress, setVoiceProgress, audioRef, availableVoices, selectedVoice, setSelectedVoice, voiceLoading, ttsAudio, setTtsAudio, showVoice, setShowVoice, showVoiceInput, setShowVoiceInput, isListening, voiceTranscript, setVoiceTranscript, isRecordingEL, elSttLoading, generateTTS, fetchVoices, playVoiceFrom, skipVoice, stopVoice, startListening, stopListening, startElevenLabsSTT, stopElevenLabsSTT, addVoiceTextToDocument } = useVoice({ canvasElements, setCanvasElements, history, document, currentPage, currentFont, currentFontSize, currentColor, language });")
# 522..1530: blank + collab hook + all other handlers up to before signature section
$pl[522..1530] | ForEach-Object { $result.Add($_) }
# Skip 1531..1627: // === SIGNATURE === + all signature handlers
# 1628..2474: blank after signatures through end of pre-layers section
$pl[1628..2474] | ForEach-Object { $result.Add($_) }
# Skip 2475..2632: // === LAYERS MANAGEMENT === + all layer/copy/align/mirror handlers
# 2633: blank line between layers and STT
$result.Add($pl[2633])
# Skip 2634..2742: // === VOICE INPUT (STT) === + all STT handlers
# 2743..2998: content between STT end and getDocText
$pl[2743..2998] | ForEach-Object { $result.Add($_) }
# Skip 2999..3026: // === VOICE === + getDocText function
# 3027..3055: blank + getFullDocContent + blank
$pl[3027..3055] | ForEach-Object { $result.Add($_) }
# Skip 3056..3142: // Fetch available ElevenLabs voices + TTS handlers (fetchVoices through stopVoice closing brace)
# 3143..end: rest of file
$pl[3143..($pl.Count - 1)] | ForEach-Object { $result.Add($_) }

Write-Host "Editor.js original: $($pl.Count) lines"
Write-Host "Editor.js new:      $($result.Count) lines"
[System.IO.File]::WriteAllLines($editorPath, $result, $utf8NoBom)
Write-Host "Done."
