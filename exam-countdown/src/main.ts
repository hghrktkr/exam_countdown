import './styles/main.scss'

interface ExamData {
  id: string;
  examName: string;
  examDate: string;
  selected: boolean;
}

// 試験情報の配列
const examData: ExamData[] = loadExamData();

// 編集中の試験id
let editingId: string | null = null;

/**
 * 試験情報をJSON形式で登録
 */
export function registerExam() {
  const registerForm = document.getElementById("register-form");
  registerForm?.addEventListener("submit", (ev: SubmitEvent) => {
    ev.preventDefault();

    const examName = document.getElementById("exam-name");
    const examDate = document.getElementById("exam-date");
    
    if (examName instanceof HTMLInputElement && examDate instanceof HTMLInputElement) {
      
      if (editingId === null) {
        
        // 新規登録
        const id = crypto.randomUUID();
        const selectedCount = examData.filter(exam => exam.selected).length;

        const data: ExamData = {
          id,
          examName: examName.value,
          examDate: examDate.value,
          selected: selectedCount < 3,
        }
  
        examData.push(data);
      } else {

        // 更新
        const editingData = examData.find(exam => exam.id === editingId);
        if (!editingData) return;
        
        editingData.examName = examName.value;
        editingData.examDate = examDate.value;

      }
      
      // localStorageに保存して再読み込み
      saveExamData();
      renderExamList();
      renderSelectedExams();
      
      // 初期化
      resetExamForm();
    }

  });
}

/**
 * 登録された試験情報をparse
 */
function loadExamData(): ExamData[] {
  const examData = localStorage.getItem("examData");
  if (!examData) return [];

  const examDataList: ExamData[] = JSON.parse(examData);

  return examDataList;
}

/**
 * examDataをlocalStorageへ保存
 */
function saveExamData() {
  localStorage.setItem("examData", JSON.stringify(examData));
}

/**
 * exam-list要素の作成
 */
export function renderExamList() {
  const examList = document.getElementById("exam-list");

  if (!examList) return;

  // いったん全削除
  examList.replaceChildren();

  if (examData.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "登録されたテストはありません";
    empty.id = "empty-list"

    examList.appendChild(empty);
    return;
  }

  const selectExamForm = document.createElement("form");
  selectExamForm.className = "exam-select-form";
  selectExamForm.id = "exam-select-form";

  for (const exam of examData) {
    const examDiv = document.createElement("div");
    examDiv.className = "exam-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "selectedExam[]";
    input.id = exam.id;
    input.value = exam.id;
    input.checked = exam.selected;

    const label = document.createElement("label");
    label.htmlFor = exam.id;
    label.textContent = exam.examName;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "exam-edit";
    editButton.dataset.id = exam.id;
    editButton.textContent = "編集";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "exam-delete";
    deleteButton.dataset.id = exam.id;
    deleteButton.textContent = "削除";
    
    const date = document.createElement("p");
    date.textContent = exam.examDate;

    const remainingDates= calculateRemainingTime(exam.examDate);
    const remaining = document.createElement("p");

    if (remainingDates > 0) {
      remaining.textContent = `残り ${remainingDates}日`;
      remaining.className = "exam-remaining";
    } else if (remainingDates === 0) {
      remaining.textContent = "今日";
      remaining.className = "exam-today";
    }
     else {
      remaining.textContent = "終了";
      remaining.className = "exam-finished";
    }
    
    examDiv.appendChild(input);
    examDiv.appendChild(label);
    examDiv.appendChild(editButton);
    examDiv.appendChild(deleteButton);
    examDiv.appendChild(date);
    examDiv.appendChild(remaining);
    selectExamForm.appendChild(examDiv);
  }
  examList.appendChild(selectExamForm);

}

/**
 * 削除ボタン押下時
 */
function onPushDeleteButton() {
  const examList = document.getElementById("exam-list");
  if (!examList) return;

  
  examList.addEventListener("click", (ev) => {
    const target = ev.target;


    if (!(target instanceof HTMLButtonElement)) return;
    console.log("削除側のイベントが実行されました");
    console.log("className:", target.className);
    console.log(`target type: ${target.type}`);
    if (target.type !== "button") return;
    if (target.className !== "exam-delete") return;


    const deleteId = target.dataset.id;
    console.log(`deleteId: ${deleteId}`);
    if (!deleteId) return;

    if (confirm("このテストを削除しますか？")) {
      deleteExam(deleteId);
    }
  });
}

/** 指定されたテストを削除 */
function deleteExam(id: string) {
  // examDataから該当のものを削除
  const deleteIndex = examData.findIndex(exam => exam.id === id);
  if (deleteIndex === -1) return;

  examData.splice(deleteIndex, 1);

  saveExamData();
  renderExamList();
  renderSelectedExams();
}

/** 編集ボタン押下時 */
function onPushEditButton() {
  const examList = document.getElementById("exam-list");
  if (!examList) return;

  
  examList.addEventListener("click", (ev) => {
    const target = ev.target;

    
    if (!(target instanceof HTMLButtonElement)) return;
    console.log("編集側のイベントが実行されました");
    console.log("className:", target.className);
    console.log(`target type: ${target.type}`);
    if (target.type !== "button") return;
    if (target.className !== "exam-edit") return;

    const editId = target.dataset.id;
    console.log(`deleteId: ${editId}`);
    if (!editId) return;

    editExam(editId);
  });

}

function editExam(id: string) {
  const editingData = examData.find(exam => exam.id === id);
  if (editingData === undefined) return;

  const examName = document.getElementById("exam-name");
  const examDate = document.getElementById("exam-date");
  const button = document.getElementById("register-exam");

  if (!examName || !(examName instanceof HTMLInputElement)) return;
  if (!examDate || !(examDate instanceof HTMLInputElement)) return;
  if (!button || !(button instanceof HTMLButtonElement)) return;

  // 編集中の情報を渡す
  examName.value = editingData.examName;
  examDate.value = editingData.examDate;

  // ボタンの表記を「更新」に
  button.textContent = "更新";

  // editingIdにIDを渡す
  editingId = editingData.id;
}

/** キャンセルボタン押下時 */
function onPushCancelButton() {
  const registerForm = document.getElementById("register-form");
  if (!registerForm) return;

  
  registerForm.addEventListener("click", (ev) => {
    const target = ev.target;

    
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.type !== "button") return;
    if (target.id !== "cancel-exam") return;
    console.log("キャンセルのイベントが実行されました");
    console.log(`target type: ${target.type}`);

    if (confirm("キャンセルしますか？")) {
      resetExamForm();
    }
  });

}

function resetExamForm() {
  const examName = document.getElementById("exam-name");
  const examDate = document.getElementById("exam-date");
  const button = document.getElementById("register-exam");

  if (!(examName instanceof HTMLInputElement)) return;
  if (!(examDate instanceof HTMLInputElement)) return;
  if (!(button instanceof HTMLButtonElement)) return;

  editingId = null;
  examName.value = "";
  examDate.value = "";
  button.textContent = "登録";
}

/** 選択されたテストのカウントダウンを表示 */
export function renderSelectedExams() {
  const selectedExams = document.getElementById("selected-exams");
  if (!selectedExams) return;

  selectedExams.replaceChildren();

  // 選択されたものを残り日数が近いもの順でfilter
  const selectedExamData = examData.filter(exam => exam.selected).sort((a, b) => {
    return (a.examDate > b.examDate) ? 1 : -1;
  });

  if (selectedExamData.length === 0) {
    const noExams = document.createElement("p");
    noExams.className = "no-exams";
    noExams.textContent = "表示選択されたテストはありません";

    selectedExams.appendChild(noExams);

    return;
  }

  for (const exam of selectedExamData) {
    const selectedExamDiv = document.createElement("div");
    selectedExamDiv.className = "exam-selected";
    selectedExamDiv.id = `selected-${exam.id}`;

    const selectedExamName = document.createElement("h2");
    selectedExamName.className = "exam-selected-name";
    selectedExamName.textContent = exam.examName;

    const selectedExamDate = document.createElement("p");
    selectedExamDate.className = "exam-selected-date";
    selectedExamDate.textContent = `(${exam.examDate})`;


    const date = calculateRemainingTime(exam.examDate);
    const selectedExamRemaining = document.createElement("p");
    selectedExamRemaining.className = "exam-selected-remaining";

    if (date > 0) {
      selectedExamRemaining.textContent = `残り ${date}日`;
      selectedExamRemaining.className = "exam-remaining";

    } else if (date === 0) {
      selectedExamRemaining.textContent = "当日";
      selectedExamRemaining.className = "exam-today";

    } else {
      selectedExamRemaining.textContent = "終了";
      selectedExamRemaining.className = "exam-finished";
    }

    selectedExamDiv.appendChild(selectedExamName);
    selectedExamDiv.appendChild(selectedExamDate);
    selectedExamDiv.appendChild(selectedExamRemaining);
    selectedExams.appendChild(selectedExamDiv);
  }
}

/**
 * 残り日数の計算
 */
function calculateRemainingTime(examDate: string): number {
  // 今日の日付を取得する
  const today = new Date();
  // 時間を0時0分にそろえる
  today.setHours(0, 0, 0, 0);


  // 試験日を日付として扱えるようにする
  const [ year, month, date ] = examDate.split("-").map(Number);
  const target = new Date(year, month - 1, date);

  // 残りの日数を計算する
  const diff = target.getTime() - today.getTime();

  // 計算結果を返す
  return Math.round(diff / (1000 * 60 * 60 * 24));

}

export function selectDisplayExam() {
  const examList = document.getElementById("exam-list");
  const warning = document.getElementById("selection-warning"); // 注意表示

  if (!examList) return;

  examList.addEventListener("change", (ev) => {
    const target = ev.target;

    // 型チェック
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "checkbox") return;

    // 最大3件チェック
    const selectedData = examData.filter(exam => exam.selected);
    if (target.checked && selectedData.length >= 3) {
      // 注意表示
      if (warning) {
        warning.hidden = false;
      }

      target.checked = false;
      return;
    }

    // 正常に変更できた場合は注意を消す
    if (warning) {
      warning.hidden = true;
    }

    const exam = examData.find(item => item.id === target.id);
    if (!exam) return;

    exam.selected = target.checked;

    // dataを上書き
    saveExamData();

    // カウントダウン更新
    renderSelectedExams();

    // ログ
    console.log("変更された試験:", exam);
    console.log("全試験データ:", examData);
    console.log(
      "localStorage:",
      localStorage.getItem("examData")
    );

  });
}

/**
 * 画面を開くトグル
 */
function setupRegisterToggle() {
  const toggleButton = document.getElementById("toggle-register");
  const registerSection = document.getElementById("register");
  const displaySection = document.getElementById("display");

  if (!(toggleButton instanceof HTMLButtonElement)) return;
  if (!(registerSection instanceof HTMLElement)) return;
  if (!(displaySection instanceof HTMLElement)) return;

  toggleButton.addEventListener("click", () => {
    const isRegisterHidden = registerSection.hidden;
    const isDisplayHidden = displaySection.hidden;

    registerSection.hidden = !isRegisterHidden;
    displaySection.hidden = !isDisplayHidden;
    toggleButton.setAttribute("aria-expanded", String(isRegisterHidden));

    toggleButton.textContent = isRegisterHidden
      ? "登録フォームを閉じる"
      : "テストを登録・編集する";
  });
}


registerExam();
renderExamList();
selectDisplayExam();
renderSelectedExams();
onPushDeleteButton();
onPushEditButton();
onPushCancelButton();
setupRegisterToggle();