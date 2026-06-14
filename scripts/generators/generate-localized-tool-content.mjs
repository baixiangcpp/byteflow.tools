import fs from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, "src/core/seo/components/tool-content-template-modules/generated")
const CACHE_DIR = path.join(OUTPUT_DIR, ".cache")
const REQUEST_DELAY_MS = 80
const FETCH_TIMEOUT_MS = 20_000
const DEFAULT_MAX_BATCH_CHARS = 4_000

const LOCALE_FILES = {
    "zh-CN": "zh-CN.json",
    "zh-TW": "zh-TW.json",
    ja: "ja.json",
    ko: "ko.json",
    de: "de.json",
    fr: "fr.json",
}

const GUIDANCE_BY_LOCALE = {
    "zh-CN": {
        workflow: (title) => [
            `先用 ${title} 的最小输入跑一次，确认基线行为。`,
            "先明确输入样例、关键参数和预期输出，再执行比对。",
            "每次只改一个变量并重跑，快速定位问题。",
            "保留一份验证通过的输出作为团队参考。",
        ],
        checklist: (title) => [
            `确认 ${title} 在相同输入下多次运行结果一致。`,
            "检查空值、超长字段、非法字符等边界输入。",
            "对外分享前完成脱敏，移除秘密数据。",
            "在桌面和移动视口都检查展示效果。",
        ],
        operational: (title) => `${title} 应作为交付流程中的快速校验步骤，在提交、发布和交接前都建议执行一次。`,
    },
    "zh-TW": {
        workflow: (title) => [
            `先用 ${title} 的最小輸入跑一次，確認基線行為。`,
            "明確確認編碼、分隔符、時區等前提。",
            "每次只調整一個變數並重跑，快速定位問題。",
            "保留一份驗證通過的輸出作為團隊參考。",
        ],
        checklist: (title) => [
            `確認 ${title} 在相同輸入下多次執行結果一致。`,
            "檢查空值、超長欄位、非法字元等邊界輸入。",
            "對外分享前先完成脫敏，移除敏感資料。",
            "在桌面與行動視口都檢查呈現效果。",
        ],
        operational: (title) => `${title} 應作為交付流程中的快速驗證步驟，建議在提交、發布與交接前執行一次。`,
    },
    ja: {
        workflow: (title) => [
            `${title} は最小入力で一度実行し、基準動作を確認します。`,
            "入力例、主要パラメータ、期待する出力を先にそろえてから確認します。",
            "一度に一つの変数だけを変更して再実行し、問題点を切り分けます。",
            "確認済みの出力を一つ残し、チームの基準サンプルにします。",
        ],
        checklist: (title) => [
            `同じ入力で ${title} を複数回実行しても結果が一致することを確認します。`,
            "空値、長すぎる項目、不正文字などの境界入力を確認します。",
            "共有前に秘密情報や個人情報を必ずマスクします。",
            "デスクトップとモバイルの両方で表示結果を確認します。",
        ],
        operational: (title) => `${title} は、提出・公開・引き継ぎの前に行う迅速な検証ステップとして運用するのが適切です。`,
    },
    ko: {
        workflow: (title) => [
            `${title} 에 최소 입력을 먼저 넣어 기준 동작을 확인합니다.`,
            "인코딩, 구분자, 시간대 같은 전제 조건을 명확히 확인합니다.",
            "한 번에 하나의 변수만 바꾸고 다시 실행해 문제 지점을 좁힙니다.",
            "검증이 끝난 출력 하나를 기준 예시로 남겨 팀과 공유합니다.",
        ],
        checklist: (title) => [
            `같은 입력에서 ${title} 결과가 반복 실행 시에도 일관적인지 확인합니다.`,
            "빈 값, 과도하게 긴 필드, 잘못된 문자 같은 경계 입력을 점검합니다.",
            "공유 전에 비밀값과 개인정보를 반드시 마스킹합니다.",
            "데스크톱과 모바일 뷰포트 모두에서 표시 상태를 확인합니다.",
        ],
        operational: (title) => `${title} 은 배포, 공유, 인수인계 전에 실행하는 빠른 검증 단계로 운영하는 것이 좋습니다.`,
    },
    de: {
        workflow: (title) => [
            `Führen Sie ${title} zuerst mit einer minimalen Eingabe aus, um das Basisverhalten zu prüfen.`,
            "Prüfen Sie Kodierung, Trennzeichen, Zeitzone und andere Annahmen explizit.",
            "Ändern Sie jeweils nur eine Variable und starten Sie den Lauf erneut, um Probleme schnell einzugrenzen.",
            "Behalten Sie eine bestätigte Ausgabe als Referenz für das Team.",
        ],
        checklist: (title) => [
            `Bestätigen Sie, dass ${title} bei identischer Eingabe konsistente Ergebnisse liefert.`,
            "Prüfen Sie Randfälle wie Leerwerte, überlange Felder und ungültige Zeichen.",
            "Entfernen oder maskieren Sie sensible Daten vor jeder Weitergabe.",
            "Kontrollieren Sie die Darstellung sowohl auf Desktop als auch mobil.",
        ],
        operational: (title) => `${title} sollte als schneller Prüfschritt im Ablauf vor Übergabe, Veröffentlichung und Weitergabe genutzt werden.`,
    },
    fr: {
        workflow: (title) => [
            `Commencez par exécuter ${title} avec une entrée minimale pour valider le comportement de base.`,
            "Vérifiez explicitement l’encodage, les séparateurs, le fuseau horaire et les autres hypothèses.",
            "Ne modifiez qu’une variable à la fois puis relancez pour isoler rapidement le problème.",
            "Conservez une sortie validée comme référence partagée pour l’équipe.",
        ],
        checklist: (title) => [
            `Vérifiez que ${title} produit un résultat cohérent lorsqu’il est relancé avec la même entrée.`,
            "Testez les cas limites comme les valeurs vides, les champs très longs et les caractères invalides.",
            "Masquez les secrets et données sensibles avant tout partage.",
            "Contrôlez le rendu sur desktop et sur mobile.",
        ],
        operational: (title) => `${title} constitue une étape de vérification rapide avant livraison, publication ou passation.`,
    },
}

const SYNTHETIC_COPY_BY_LOCALE = {
    "zh-CN": {
        intentTerms: { formatter: "格式整理", generator: "生成", converter: "转换", analyzer: "分析与检查" },
        descriptionFallback: (title, intentTerm) => `${title} 用于浏览器内的${intentTerm}工作流。`,
        intro: (title, description, intentTerm) => `${description} 这个页面适合在浏览器中快速完成${intentTerm}确认，并在提交、分享或交接前保留可复现的输入与输出记录。`,
        whatThisToolDoes: (title, description, intentTerm) => [
            `${title} 会根据当前输入立即更新结果，方便先确认主要输出是否符合预期。`,
            `页面描述聚焦在这件事上：${description}`,
            `把 ${title} 放进${intentTerm}流程中，可以更早发现格式、内容或参数上的落差。`,
        ],
        useCases: (title, intentTerm) => [
            `在正式提交前，用 ${title} 先检查代表性样本。`,
            `在 PR、工单或交接文档里附上 ${title} 的输入输出结果。`,
            `把 ${title} 作为${intentTerm}阶段的快速复核步骤。`,
            `针对边界输入再跑一遍 ${title}，提前暴露异常情况。`,
        ],
        inputLabel: (index) => ["主要输入示例", "边界输入示例", "补充输入示例"][index] || `补充输入示例 ${index + 1}`,
        outputLabel: (index) => ["输出结果示例", "复核输出示例", "交付前记录"][index] || `补充输出示例 ${index + 1}`,
        inputFallback: (title, _description, index) => index === 0
            ? `准备一份最能代表 ${title} 实际使用场景的输入样本。`
            : index === 1
                ? `补充空值、超长字段或异常字符，确认 ${title} 在边界情况下的表现。`
                : `保留一份 ${title} 的额外输入样本，用于团队复核。`,
        outputFallback: (title, _description, index) => index === 0
            ? `保留一份通过 ${title} 验证的输出结果，作为后续比对基线。`
            : index === 1
                ? `把 ${title} 的输出摘要记录到 PR、工单或发布检查单中。`
                : `在交付前再次确认 ${title} 的最终输出与预期一致。`,
        commonErrors: (title) => [
            { error: `${title} 的输入结构不完整`, fix: "先核对必填字段、分隔符和编码设置，再重新执行。" },
            { error: "复制内容时混入了不可见字符", fix: "用纯文本重新粘贴，并移除首尾空白后再检查。" },
            { error: "团队分享时直接暴露了原始数据", fix: `在导出 ${title} 结果前先完成脱敏，移除秘密值与个人信息。` },
        ],
        privacyNotes: [
            "优先使用脱敏后的真实样本，避免把生产数据直接带入评审流程。",
            "复制结果后请确认剪贴板中没有保留 token、密钥或个人信息。",
            "在桌面端和移动端都复核一次展示结果，避免交付时出现上下文偏差。",
        ],
        faqs: (title, intentTerm) => [
            { q: `${title} 适合放在什么环节使用？`, a: `最适合在${intentTerm}阶段的最后一步使用，用来做快速复核和交付前确认。` },
            { q: `${title} 的结果应该如何留档？`, a: "建议保留一份代表性输入和一份确认通过的输出，方便 PR、工单和交接复用。" },
            { q: `${title} 能替代自动化测试吗？`, a: "不能。它适合交互式检查和人工复核，自动化测试与监控仍然是正式发布的必需环节。" },
        ],
    },
    "zh-TW": {
        intentTerms: { formatter: "格式整理", generator: "生成", converter: "轉換", analyzer: "分析與檢查" },
        descriptionFallback: (title, intentTerm) => `${title} 用於瀏覽器內的${intentTerm}流程。`,
        intro: (title, description, intentTerm) => `${description} 這個頁面適合在瀏覽器中快速完成${intentTerm}確認，並在提交、分享或交接前保留可重現的輸入與輸出紀錄。`,
        whatThisToolDoes: (title, description, intentTerm) => [
            `${title} 會依照目前輸入立即更新結果，方便先確認主要輸出是否符合預期。`,
            `頁面描述聚焦在這件事上：${description}`,
            `把 ${title} 放進${intentTerm}流程中，可以更早發現格式、內容或參數上的落差。`,
        ],
        useCases: (title, intentTerm) => [
            `在正式提交前，用 ${title} 先檢查代表性樣本。`,
            `在 PR、工單或交接文件中附上 ${title} 的輸入輸出結果。`,
            `把 ${title} 作為${intentTerm}階段的快速複核步驟。`,
            `針對邊界輸入再跑一次 ${title}，提早暴露異常情況。`,
        ],
        inputLabel: (index) => ["主要輸入範例", "邊界輸入範例", "補充輸入範例"][index] || `補充輸入範例 ${index + 1}`,
        outputLabel: (index) => ["輸出結果範例", "複核輸出範例", "交付前紀錄"][index] || `補充輸出範例 ${index + 1}`,
        inputFallback: (title, _description, index) => index === 0
            ? `準備一份最能代表 ${title} 實際使用情境的輸入樣本。`
            : index === 1
                ? `補充空值、超長欄位或異常字元，確認 ${title} 在邊界情況下的表現。`
                : `保留一份 ${title} 的額外輸入樣本，供團隊複核。`,
        outputFallback: (title, _description, index) => index === 0
            ? `保留一份通過 ${title} 驗證的輸出結果，作為後續比對基線。`
            : index === 1
                ? `把 ${title} 的輸出摘要記錄到 PR、工單或發佈檢查清單中。`
                : `在交付前再次確認 ${title} 的最終輸出與預期一致。`,
        commonErrors: (title) => [
            { error: `${title} 的輸入結構不完整`, fix: "先核對必填欄位、分隔符與編碼設定，再重新執行。" },
            { error: "複製內容時混入了不可見字元", fix: "以純文字重新貼上，並移除前後空白後再檢查。" },
            { error: "團隊分享時直接暴露了原始資料", fix: `在匯出 ${title} 結果前先完成脫敏，移除秘密值與個資。` },
        ],
        privacyNotes: [
            "優先使用脫敏後的真實樣本，避免將生產資料直接帶入評審流程。",
            "複製結果後請確認剪貼簿中沒有保留 token、金鑰或個資。",
            "在桌機與行動端都複核一次呈現結果，避免交付時出現上下文偏差。",
        ],
        faqs: (title, intentTerm) => [
            { q: `${title} 適合放在哪個環節使用？`, a: `最適合在${intentTerm}階段的最後一步使用，用來做快速複核與交付前確認。` },
            { q: `${title} 的結果應該如何留存？`, a: "建議保留一份代表性輸入與一份確認通過的輸出，方便 PR、工單與交接重用。" },
            { q: `${title} 能取代自動化測試嗎？`, a: "不能。它適合互動式檢查與人工複核，正式發佈仍需自動化測試與監控。" },
        ],
    },
    ja: {
        intentTerms: { formatter: "整形", generator: "生成", converter: "変換", analyzer: "分析と確認" },
        descriptionFallback: (title, intentTerm) => `${title} はブラウザ内の${intentTerm}作業に使うページです。`,
        intro: (title, description, intentTerm) => `${description} このページは、ブラウザ内で${intentTerm}を素早く確認し、提出や共有、引き継ぎの前に再現可能な入出力を残すために使えます。`,
        whatThisToolDoes: (title, description, intentTerm) => [
            `${title} は現在の入力に応じて結果をすぐ更新し、主要な出力が期待通りかを先に確認できます。`,
            `このページが重視している観点は次のとおりです: ${description}`,
            `${title} を${intentTerm}の流れに組み込むことで、形式・内容・パラメータのずれを早い段階で発見できます。`,
        ],
        useCases: (title, intentTerm) => [
            `本番反映前に、${title} で代表的なサンプルを確認する。`,
            `PR、チケット、引き継ぎ資料に ${title} の入出力結果を添付する。`,
            `${title} を${intentTerm}工程のクイックレビュー手順として使う。`,
            `境界入力でもう一度 ${title} を実行し、想定外ケースを先に見つける。`,
        ],
        inputLabel: (index) => ["主要入力例", "境界入力例", "補足入力例"][index] || `補足入力例 ${index + 1}`,
        outputLabel: (index) => ["出力例", "レビュー用出力", "引き継ぎ前メモ"][index] || `補足出力例 ${index + 1}`,
        inputFallback: (title, _description, index) => index === 0
            ? `${title} の実運用に最も近い入力サンプルを 1 つ用意します。`
            : index === 1
                ? `空値、長すぎる値、不正文字を含む境界ケースで ${title} の挙動を確認します。`
                : `${title} の補足入力例を 1 つ残し、チームレビューに使います。`,
        outputFallback: (title, _description, index) => index === 0
            ? `${title} で確認済みの出力を 1 つ残し、比較の基準にします。`
            : index === 1
                ? `${title} の出力要点を PR やチケットに記録して共有します。`
                : `リリース前に ${title} の最終出力が期待と一致するか再確認します。`,
        commonErrors: (title) => [
            { error: `${title} に渡す入力構造が不足している`, fix: "必須項目、入力形式、前提条件を確認してから再実行してください。" },
            { error: "貼り付け時に不可視文字が混入している", fix: "プレーンテキストで再貼り付けし、前後の空白を除去してください。" },
            { error: "共有前に元データをそのまま残している", fix: `${title} の結果を共有する前に、秘密情報や個人情報をマスクしてください。` },
        ],
        privacyNotes: [
            "レビュー用サンプルは、可能な限り脱敏した実データを使ってください。",
            "コピー後は、クリップボードに token や秘密情報が残っていないか確認してください。",
            "デスクトップとモバイルの両方で最終表示を確認し、共有時の齟齬を防いでください。",
        ],
        faqs: (title, intentTerm) => [
            { q: `${title} はどの工程で使うのがよいですか？`, a: `${intentTerm}工程の最後に置き、短時間で確認してから提出や共有に進む使い方が適切です。` },
            { q: `${title} の確認結果はどう残せばよいですか？`, a: "代表的な入力 1 件と、確認済みの出力 1 件を残しておくと、PR や引き継ぎで再利用しやすくなります。" },
            { q: `${title} は自動テストの代わりになりますか？`, a: "なりません。対話的な確認には有効ですが、正式な品質担保には自動テストと監視が必要です。" },
        ],
    },
    ko: {
        intentTerms: { formatter: "형식 정리", generator: "생성", converter: "변환", analyzer: "분석과 점검" },
        descriptionFallback: (title, intentTerm) => `${title} 은 브라우저 안에서 ${intentTerm} 작업을 점검하는 페이지입니다.`,
        intro: (title, description, intentTerm) => `${description} 이 페이지는 브라우저 안에서 ${intentTerm} 결과를 빠르게 확인하고, 제출이나 공유, 인수인계 전에 재현 가능한 입출력 기록을 남길 때 적합합니다.`,
        whatThisToolDoes: (title, description, intentTerm) => [
            `${title} 은 현재 입력에 맞춰 결과를 즉시 갱신하므로 핵심 출력이 기대와 맞는지 먼저 확인할 수 있습니다.`,
            `이 페이지가 중점적으로 다루는 내용은 다음과 같습니다: ${description}`,
            `${title} 을 ${intentTerm} 흐름에 넣으면 형식, 내용, 파라미터 차이를 더 이른 단계에서 발견할 수 있습니다.`,
        ],
        useCases: (title, intentTerm) => [
            `배포 전에 ${title} 으로 대표 샘플을 먼저 확인합니다.`,
            `PR, 티켓, 인수인계 문서에 ${title} 의 입력과 출력을 함께 남깁니다.`,
            `${title} 을 ${intentTerm} 단계의 빠른 재검토 절차로 사용합니다.`,
            `경계 입력으로 ${title} 을 한 번 더 실행해 예외 상황을 미리 드러냅니다.`,
        ],
        inputLabel: (index) => ["주요 입력 예시", "경계 입력 예시", "보조 입력 예시"][index] || `보조 입력 예시 ${index + 1}`,
        outputLabel: (index) => ["출력 예시", "검토용 출력", "전달 전 기록"][index] || `보조 출력 예시 ${index + 1}`,
        inputFallback: (title, _description, index) => index === 0
            ? `${title} 의 실제 사용 상황을 가장 잘 보여주는 입력 샘플을 준비합니다.`
            : index === 1
                ? `빈 값, 긴 필드, 잘못된 문자를 포함한 경계 입력으로 ${title} 동작을 확인합니다.`
                : `${title} 검토용 보조 입력 예시를 하나 더 남겨 팀과 공유합니다.`,
        outputFallback: (title, _description, index) => index === 0
            ? `${title} 에서 확인이 끝난 출력 하나를 남겨 비교 기준으로 사용합니다.`
            : index === 1
                ? `${title} 출력 요약을 PR이나 티켓에 기록해 공유합니다.`
                : `배포 전에 ${title} 의 최종 출력이 기대와 일치하는지 다시 확인합니다.`,
        commonErrors: (title) => [
            { error: `${title} 에 전달한 입력 구조가 불완전함`, fix: "필수 필드, 구분자, 인코딩 설정을 확인한 뒤 다시 실행하세요." },
            { error: "붙여넣기 과정에서 보이지 않는 문자가 섞임", fix: "일반 텍스트로 다시 붙여넣고 앞뒤 공백을 정리하세요." },
            { error: "공유 전에 원본 데이터를 그대로 노출함", fix: `${title} 결과를 내보내기 전에 비밀값과 개인정보를 마스킹하세요.` },
        ],
        privacyNotes: [
            "검토용 샘플은 가능한 한 비식별화된 실제 데이터를 사용하세요.",
            "복사 후에는 클립보드에 token, 키, 개인정보가 남아 있지 않은지 확인하세요.",
            "데스크톱과 모바일에서 모두 최종 표시 상태를 점검해 전달 시 혼선을 줄이세요.",
        ],
        faqs: (title, intentTerm) => [
            { q: `${title} 은 어느 단계에서 쓰는 것이 좋나요?`, a: `${intentTerm} 단계의 마지막 점검으로 두고, 빠르게 확인한 뒤 제출이나 공유로 넘어가는 방식이 적합합니다.` },
            { q: `${title} 결과는 어떻게 남겨야 하나요?`, a: "대표 입력 1건과 확인된 출력 1건을 남기면 PR, 티켓, 인수인계에서 다시 쓰기 쉽습니다." },
            { q: `${title} 이 자동화 테스트를 대신하나요?`, a: "아닙니다. 상호작용 점검에는 유용하지만, 정식 품질 보증에는 자동화 테스트와 모니터링이 필요합니다." },
        ],
    },
    de: {
        intentTerms: { formatter: "Formatprüfung", generator: "Erzeugung", converter: "Konvertierung", analyzer: "Analyse und Prüfung" },
        descriptionFallback: (title, intentTerm) => `${title} unterstützt browserbasierte ${intentTerm}.`,
        intro: (title, description, intentTerm) => `${description} Diese Seite eignet sich, um ${intentTerm} direkt im Browser zu prüfen und vor Übergabe, Freigabe oder Teilen nachvollziehbare Ein- und Ausgaben festzuhalten.`,
        whatThisToolDoes: (title, description, intentTerm) => [
            `${title} aktualisiert das Ergebnis sofort auf Basis der aktuellen Eingabe, sodass sich die wichtigste Ausgabe zuerst prüfen lässt.`,
            `Der Schwerpunkt dieser Seite liegt auf folgendem Punkt: ${description}`,
            `Wenn ${title} in den ${intentTerm}-Ablauf eingebaut wird, fallen Unterschiede bei Format, Inhalt oder Parametern deutlich früher auf.`,
        ],
        useCases: (title, intentTerm) => [
            `Vor dem eigentlichen Rollout mit ${title} einen repräsentativen Beispieldatensatz prüfen.`,
            `Ein- und Ausgaben von ${title} in PRs, Tickets oder Übergabedokumente aufnehmen.`,
            `${title} als schnellen Prüfschritt im ${intentTerm}-Abschnitt verwenden.`,
            `${title} zusätzlich mit Grenzfällen ausführen, um Ausnahmen vorab sichtbar zu machen.`,
        ],
        inputLabel: (index) => ["Primäres Eingabebeispiel", "Grenzfall-Eingabe", "Zusätzliche Eingabe"][index] || `Zusätzliche Eingabe ${index + 1}`,
        outputLabel: (index) => ["Ausgabebeispiel", "Review-Ausgabe", "Übergabenotiz"][index] || `Zusätzliche Ausgabe ${index + 1}`,
        inputFallback: (title, _description, index) => index === 0
            ? `Verwenden Sie eine Eingabe, die den typischen Einsatz von ${title} realistisch abbildet.`
            : index === 1
                ? `Prüfen Sie ${title} zusätzlich mit Leerwerten, langen Feldern oder ungültigen Zeichen.`
                : `Halten Sie ein weiteres Eingabebeispiel für das Teamreview mit ${title} fest.`,
        outputFallback: (title, _description, index) => index === 0
            ? `Bewahren Sie eine mit ${title} bestätigte Ausgabe als Vergleichsbasis auf.`
            : index === 1
                ? `Dokumentieren Sie die wichtigsten Ergebnisse von ${title} in PRs oder Tickets.`
                : `Prüfen Sie vor der Übergabe erneut, ob die finale Ausgabe von ${title} den Erwartungen entspricht.`,
        commonErrors: (title) => [
            { error: `Die Eingabestruktur für ${title} ist unvollständig`, fix: "Pflichtfelder, Trennzeichen und Kodierung prüfen und dann erneut ausführen." },
            { error: "Beim Einfügen wurden unsichtbare Zeichen übernommen", fix: "Als Klartext erneut einfügen und führende bzw. nachgestellte Leerzeichen entfernen." },
            { error: "Rohdaten werden vor dem Teilen nicht maskiert", fix: `Vor dem Export aus ${title} sensible Werte und personenbezogene Daten entfernen oder maskieren.` },
        ],
        privacyNotes: [
            "Für Reviews möglichst anonymisierte echte Beispieldaten verwenden.",
            "Nach dem Kopieren prüfen, ob Token, Schlüssel oder personenbezogene Daten noch in der Zwischenablage liegen.",
            "Die Darstellung auf Desktop und mobil gegenprüfen, damit beim Teilen kein Kontext verloren geht.",
        ],
        faqs: (title, intentTerm) => [
            { q: `In welchem Schritt sollte ${title} eingesetzt werden?`, a: `Am sinnvollsten ist ${title} als letzter kurzer Prüfschritt im ${intentTerm}-Abschnitt vor Übergabe oder Freigabe.` },
            { q: `Wie sollte das Ergebnis von ${title} dokumentiert werden?`, a: "Eine repräsentative Eingabe und eine bestätigte Ausgabe reichen meist aus, um PRs, Tickets und Übergaben zu unterstützen." },
            { q: `Ersetzt ${title} automatisierte Tests?`, a: "Nein. Die Seite ist für manuelle Schnellprüfungen gedacht, ersetzt aber weder automatisierte Tests noch Monitoring." },
        ],
    },
    fr: {
        intentTerms: { formatter: "vérification de format", generator: "génération", converter: "conversion", analyzer: "analyse et contrôle" },
        descriptionFallback: (title, intentTerm) => `${title} sert à ${frIntentWithArticle(intentTerm)} directement dans le navigateur.`,
        intro: (title, description, intentTerm) => `${description} Cette page est utile pour valider ${frIntentWithArticle(intentTerm)} dans le navigateur et conserver des entrées/sorties reproductibles avant livraison, partage ou passation.`,
        whatThisToolDoes: (title, description, intentTerm) => [
            `${title} met à jour le résultat immédiatement à partir de l’entrée courante afin de vérifier d’abord la sortie principale.`,
            `Le point central de cette page est le suivant : ${description}`,
            `En intégrant ${title} dans un flux ${frIntentWithDe(intentTerm)}, les écarts de format, de contenu ou de paramètres apparaissent plus tôt.`,
        ],
        useCases: (title, intentTerm) => [
            `Vérifier un échantillon représentatif avec ${title} avant la livraison réelle.`,
            `Joindre les entrées et sorties de ${title} dans les PR, tickets ou documents de passation.`,
            `Utiliser ${title} comme étape de revue rapide dans la phase ${frIntentWithDe(intentTerm)}.`,
            `Relancer ${title} avec des cas limites pour détecter les écarts avant qu’ils n’arrivent en production.`,
        ],
        inputLabel: (index) => ["Exemple d'entrée principal", "Exemple d'entrée limite", "Exemple d'entrée complémentaire"][index] || `Exemple d'entrée complémentaire ${index + 1}`,
        outputLabel: (index) => ["Exemple de sortie", "Sortie pour revue", "Note avant livraison"][index] || `Exemple de sortie complémentaire ${index + 1}`,
        inputFallback: (title, _description, index) => index === 0
            ? `Préparez une entrée qui représente au mieux l’usage réel de ${title}.`
            : index === 1
                ? `Ajoutez des valeurs vides, des champs trop longs ou des caractères invalides pour contrôler ${title} sur les cas limites.`
                : `Conservez un exemple d’entrée supplémentaire pour la revue d’équipe autour de ${title}.`,
        outputFallback: (title, _description, index) => index === 0
            ? `Gardez une sortie validée avec ${title} comme base de comparaison.`
            : index === 1
                ? `Consignez les points clés de la sortie de ${title} dans la PR ou le ticket concerné.`
                : `Avant la livraison, vérifiez encore une fois que la sortie finale de ${title} correspond bien à l’attendu.`,
        commonErrors: (title) => [
            { error: `La structure d’entrée fournie à ${title} est incomplète`, fix: "Vérifiez les champs requis, les séparateurs et l’encodage avant de relancer." },
            { error: "Le collage a introduit des caractères invisibles", fix: "Recoller en texte brut puis supprimer les espaces superflus au début et à la fin." },
            { error: "Les données brutes sont partagées sans masquage", fix: `Avant d’exporter depuis ${title}, masquez les secrets et les données personnelles.` },
        ],
        privacyNotes: [
            "Pour les revues, privilégiez des exemples réels déjà désensibilisés.",
            "Après une copie, vérifiez que le presse-papiers ne contient plus de token, de clé ou de donnée sensible.",
            "Contrôlez le rendu sur desktop et sur mobile pour éviter toute perte de contexte au moment du partage.",
        ],
        faqs: (title, intentTerm) => [
            { q: `À quel moment utiliser ${title} ?`, a: `${title} est surtout utile comme dernier contrôle rapide pendant la phase ${frIntentWithDe(intentTerm)}, juste avant livraison ou partage.` },
            { q: `Comment conserver le résultat de ${title} ?`, a: "Une entrée représentative et une sortie validée suffisent généralement pour les PR, tickets et passations." },
            { q: `${title} remplace-t-il les tests automatisés ?`, a: "Non. Cette page aide à la revue interactive, mais les tests automatisés et la surveillance restent indispensables." },
        ],
    },
}

function getFlag(name) {
    const entry = process.argv.find((arg) => arg.startsWith(`${name}=`))
    return entry ? entry.slice(name.length + 1) : null
}

function parseLocales() {
    const raw = getFlag("--locales")
    if (!raw) return Object.keys(LOCALE_FILES)
    return raw.split(",").map((value) => value.trim()).filter(Boolean)
}

function parseMaxBatchChars() {
    const raw = getFlag("--max-batch-chars")
    if (!raw) return DEFAULT_MAX_BATCH_CHARS
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_BATCH_CHARS
}

function parseMode() {
    return getFlag("--mode")?.trim() || "translate"
}

function frIntentWithArticle(intentTerm) {
    if (intentTerm === "analyse et contrôle") return "l’analyse et le contrôle"
    return `la ${intentTerm}`
}

function frIntentWithDe(intentTerm) {
    if (intentTerm === "analyse et contrôle") return "d’analyse et de contrôle"
    return `de ${intentTerm}`
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function isCodeLikeValue(value) {
    if (!/[A-Za-z]/.test(value)) return true
    if (/https?:\/\//.test(value) || /data:/.test(value)) return true
    if (/^[A-Za-z0-9+/=:_-]{16,}$/.test(value.trim()) && !value.includes(" ")) return true
    if (/[{}\[\]<>]/.test(value)) return true
    return !value.trim().includes(" ")
}

function shouldTranslateExampleValue(value) {
    if (isCodeLikeValue(value)) return false
    if (!value.includes("\n")) return /\s/.test(value)

    if (/[{}\[\]<>]/.test(value) || /https?:\/\//.test(value)) return false
    const lines = value.split("\n").map((line) => line.trim()).filter(Boolean)
    if (lines.length === 0) return false

    const proseLines = lines.filter((line) => /[A-Za-z]/.test(line) && !/^[\w./:+#-]+$/.test(line))
    return proseLines.length >= Math.ceil(lines.length / 2)
}

function collectStrings(template) {
    const strings = [template.intro, ...template.whatThisToolDoes, ...template.useCases, ...template.privacyNotes]
    for (const item of template.inputExamples) {
        strings.push(item.label)
        if (shouldTranslateExampleValue(item.value)) strings.push(item.value)
    }
    for (const item of template.outputExamples) {
        strings.push(item.label)
        if (shouldTranslateExampleValue(item.value)) strings.push(item.value)
    }
    for (const item of template.commonErrors) {
        strings.push(item.error, item.fix)
    }
    for (const item of template.faqs) {
        strings.push(item.q, item.a)
    }
    return strings
}

async function fetchTranslation(locale, text) {
    const params = new URLSearchParams({
        client: "gtx",
        sl: "en",
        tl: locale,
        dt: "t",
        q: text,
    })
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { connection: "close" },
    })

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.json()
    return payload[0].map((part) => part[0]).join("")
}

async function loadTranslationCache(locale) {
    try {
        const raw = await fs.readFile(path.join(CACHE_DIR, `${locale}.json`), "utf8")
        return new Map(Object.entries(JSON.parse(raw)))
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            return new Map()
        }
        throw error
    }
}

async function saveTranslationCache(locale, cache) {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(path.join(CACHE_DIR, `${locale}.json`), `${JSON.stringify(Object.fromEntries(cache), null, 2)}\n`, "utf8")
}

async function translateSingle(locale, text) {
    const wrapped = `__BF_0__${text}__BFEND_0__`
    for (let attempt = 1; attempt <= 8; attempt += 1) {
        try {
            const output = await fetchTranslation(locale, wrapped)
            const match = output.match(/__BF_0__(.*?)__BFEND_0__/s)
            if (!match?.[1]) throw new Error("single marker mismatch")
            return match[1].trim()
        } catch (error) {
            if (attempt === 8) throw error
            await sleep(REQUEST_DELAY_MS * attempt * 12)
        }
    }
    return text
}

async function translateBatch(locale, texts, onPartial) {
    const wrapped = texts.map((text, index) => `__BF_${index}__${text}__BFEND_${index}__`).join(" ")

    for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
            const output = await fetchTranslation(locale, wrapped)
            const matches = [...output.matchAll(/__BF_(\d+)__(.*?)__BFEND_\1__/gs)]

            if (matches.length !== texts.length) {
                throw new Error(`marker mismatch: expected ${texts.length}, got ${matches.length}`)
            }

            const translated = Array.from({ length: texts.length }, () => "")
            for (const match of matches) translated[Number(match[1])] = match[2].trim()

            if (translated.some((value) => value.length === 0)) {
                throw new Error("empty translated segment detected")
            }

            return translated
        } catch {
            if (attempt === 3) {
                console.warn(`${locale}: batch fallback to single-translate for ${texts.length} texts`)
                const translated = []
                for (const text of texts) {
                    const value = await translateSingle(locale, text)
                    translated.push(value)
                    if (onPartial) await onPartial(text, value)
                    await sleep(REQUEST_DELAY_MS)
                }
                return translated
            }
            await sleep(REQUEST_DELAY_MS * attempt * 6)
        }
    }

    return texts
}

function buildBatchPlan(texts, maxBatchChars) {
    const plan = []
    let index = 0

    while (index < texts.length) {
        let batchChars = 0
        const batch = []

        while (index < texts.length) {
            const projected = batchChars + texts[index].length + 40
            if (batch.length > 0 && projected > maxBatchChars) break
            batch.push(texts[index])
            batchChars = projected
            index += 1
        }

        plan.push(batch)
    }

    return plan
}

async function loadTopTemplates() {
    const modulePath = path.join(ROOT, "src/core/seo/components/tool-content-template-modules/top-templates.ts")
    const templatesModule = await import(pathToFileURL(modulePath).href)
    return templatesModule.TOP_TOOL_CONTENT_TEMPLATES
}

async function loadToolIndex() {
    return JSON.parse(await fs.readFile(path.join(ROOT, "src/generated/tool-index.json"), "utf8"))
}

function resolveFallbackIntentFamily(toolKey, toolSlug, category) {
    const source = `${toolKey} ${toolSlug}`.toLowerCase()

    const converterSignal = source.includes("converter")
        || source.includes("-to-")
        || source.includes("_to_")
        || source.includes("encode_decode")
        || source.includes("encode-decode")
    if (converterSignal) return "converter"

    if (source.includes("generator")) return "generator"

    const formatterSignal = source.includes("formatter")
        || source.includes("minifier")
        || source.includes("beautifier")
    if (formatterSignal) return "formatter"

    const analyzerSignal = source.includes("analyzer")
        || source.includes("checker")
        || source.includes("validator")
        || source.includes("parser")
        || source.includes("lookup")
        || source.includes("viewer")
        || source.includes("diff")
        || source.includes("counter")
        || source.includes("inspector")
        || source.includes("tester")
        || source.includes("preview")
        || source.includes("decoder")
        || source.includes("encoder")
        || source.includes("workbench")
        || source.includes("calculator")
        || source.includes("extractor")
        || source.includes("optimizer")
        || source.includes("visualizer")
    if (analyzerSignal) return "analyzer"

    if (category === "formatters") return "formatter"
    if (category === "generators") return "generator"
    return "analyzer"
}

async function loadTranslations(filename) {
    return JSON.parse(await fs.readFile(path.join(ROOT, "src/core/i18n/translations", filename), "utf8"))
}

function buildSyntheticLocaleEntries(locale, templates, localeTranslations, toolMetaBySlug, resolveIntentFamily) {
    const guidance = GUIDANCE_BY_LOCALE[locale]
    const copy = SYNTHETIC_COPY_BY_LOCALE[locale]
    if (!guidance || !copy) throw new Error(`Missing synthetic copy for locale ${locale}`)

    const result = {}
    for (const [slug, template] of Object.entries(templates)) {
        const toolMeta = toolMetaBySlug.get(slug)
        const localeTitle = localeTranslations.tools?.[template.toolKey]?.title || template.toolKey
        const localeDescription = localeTranslations.tools?.[template.toolKey]?.description
            || copy.descriptionFallback(localeTitle, copy.intentTerms.analyzer)
        const intent = toolMeta
            ? resolveIntentFamily(template.toolKey, slug, toolMeta.category)
            : "analyzer"
        const intentTerm = copy.intentTerms[intent]

        result[slug] = {
            content: {
                toolKey: template.toolKey,
                intro: copy.intro(localeTitle, localeDescription, intentTerm),
                whatThisToolDoes: copy.whatThisToolDoes(localeTitle, localeDescription, intentTerm),
                useCases: copy.useCases(localeTitle, intentTerm),
                inputExamples: template.inputExamples.map((item, index) => ({
                    label: copy.inputLabel(index),
                    value: shouldTranslateExampleValue(item.value)
                        ? copy.inputFallback(localeTitle, localeDescription, index)
                        : item.value,
                })),
                outputExamples: template.outputExamples.map((item, index) => ({
                    label: copy.outputLabel(index),
                    value: shouldTranslateExampleValue(item.value)
                        ? copy.outputFallback(localeTitle, localeDescription, index)
                        : item.value,
                })),
                commonErrors: copy.commonErrors(localeTitle),
                privacyNotes: copy.privacyNotes,
                faqs: copy.faqs(localeTitle, intentTerm),
            },
            workflowSteps: guidance.workflow(localeTitle),
            qualityChecklist: guidance.checklist(localeTitle),
            operationalNote: guidance.operational(localeTitle),
        }
    }

    return result
}

async function generateLocale(locale, templates, enTranslations, localeTranslations, maxBatchChars, options) {
    const guidance = GUIDANCE_BY_LOCALE[locale]
    if (!guidance) throw new Error(`Missing guidance copy for locale ${locale}`)

    if (options.mode === "synthetic") {
        const result = buildSyntheticLocaleEntries(
            locale,
            templates,
            localeTranslations,
            options.toolMetaBySlug,
            options.resolveIntentFamily,
        )
        await fs.mkdir(OUTPUT_DIR, { recursive: true })
        await fs.writeFile(path.join(OUTPUT_DIR, `${locale}.json`), `${JSON.stringify(result, null, 2)}\n`, "utf8")
        console.log(`${locale}: wrote ${Object.keys(result).length} tools (synthetic)`)
        return
    }

    const uniqueTexts = Array.from(new Set(
        Object.values(templates).flatMap((template) => collectStrings(template)),
    ))

    const translatedMap = await loadTranslationCache(locale)
    const pendingTexts = uniqueTexts.filter((text) => !translatedMap.has(text))
    const batches = buildBatchPlan(pendingTexts, maxBatchChars)

    console.log(`${locale}: start (${batches.length} batches, ${translatedMap.size}/${uniqueTexts.length} cached)`)

    for (let index = 0; index < batches.length; index += 1) {
        const batch = batches[index]
        const translated = await translateBatch(locale, batch, async (text, value) => {
            translatedMap.set(text, value)
            await saveTranslationCache(locale, translatedMap)
        })
        batch.forEach((text, currentIndex) => translatedMap.set(text, translated[currentIndex]))
        await saveTranslationCache(locale, translatedMap)

        if ((index + 1) % 5 === 0 || index === batches.length - 1) {
            console.log(`${locale}: translated batch ${index + 1}/${batches.length}`)
        }

        await sleep(REQUEST_DELAY_MS)
    }

    const result = {}
    for (const [slug, template] of Object.entries(templates)) {
        const toolKey = template.toolKey
        const enTitle = enTranslations.tools?.[toolKey]?.title || toolKey
        const localeTitle = localeTranslations.tools?.[toolKey]?.title || enTitle
        const replaceTitle = (value) => value.replaceAll(enTitle, localeTitle)

        result[slug] = {
            content: {
                toolKey,
                intro: replaceTitle(translatedMap.get(template.intro) || template.intro),
                whatThisToolDoes: template.whatThisToolDoes.map((item) => replaceTitle(translatedMap.get(item) || item)),
                useCases: template.useCases.map((item) => replaceTitle(translatedMap.get(item) || item)),
                inputExamples: template.inputExamples.map((item) => ({
                    label: translatedMap.get(item.label) || item.label,
                    value: shouldTranslateExampleValue(item.value) ? replaceTitle(translatedMap.get(item.value) || item.value) : item.value,
                })),
                outputExamples: template.outputExamples.map((item) => ({
                    label: translatedMap.get(item.label) || item.label,
                    value: shouldTranslateExampleValue(item.value) ? replaceTitle(translatedMap.get(item.value) || item.value) : item.value,
                })),
                commonErrors: template.commonErrors.map((item) => ({
                    error: replaceTitle(translatedMap.get(item.error) || item.error),
                    fix: replaceTitle(translatedMap.get(item.fix) || item.fix),
                })),
                privacyNotes: template.privacyNotes.map((item) => replaceTitle(translatedMap.get(item) || item)),
                faqs: template.faqs.map((item) => ({
                    q: replaceTitle(translatedMap.get(item.q) || item.q),
                    a: replaceTitle(translatedMap.get(item.a) || item.a),
                })),
            },
            workflowSteps: guidance.workflow(localeTitle),
            qualityChecklist: guidance.checklist(localeTitle),
            operationalNote: guidance.operational(localeTitle),
        }
    }

    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    await fs.writeFile(path.join(OUTPUT_DIR, `${locale}.json`), `${JSON.stringify(result, null, 2)}\n`, "utf8")
    console.log(`${locale}: wrote ${Object.keys(result).length} tools`)
}

async function main() {
    const locales = parseLocales()
    const maxBatchChars = parseMaxBatchChars()
    const mode = parseMode()
    const invalidLocales = locales.filter((locale) => !(locale in LOCALE_FILES))
    if (invalidLocales.length > 0) {
        throw new Error(`Unsupported locales: ${invalidLocales.join(", ")}`)
    }
    if (mode !== "translate" && mode !== "synthetic") {
        throw new Error(`Unsupported mode: ${mode}`)
    }

    const templates = await loadTopTemplates()
    const enTranslations = await loadTranslations("en.json")
    const toolIndex = await loadToolIndex()
    const toolMetaBySlug = new Map(toolIndex.canonicalTools.map((tool) => [tool.slug, tool]))

    for (const locale of locales) {
        const localeTranslations = await loadTranslations(LOCALE_FILES[locale])
        await generateLocale(locale, templates, enTranslations, localeTranslations, maxBatchChars, {
            mode,
            toolMetaBySlug,
            resolveIntentFamily: resolveFallbackIntentFamily,
        })
    }
}

await main()
