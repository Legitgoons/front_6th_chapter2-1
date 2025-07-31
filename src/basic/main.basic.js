/**
 * DOM 요소 및 상태 관리자 (React useRef/useState 패턴)
 * React 변환 시 useRef/useState로 직접 변환 가능
 */
const useDOMManager = {
  // DOM 요소 참조 (React의 useRef와 동일한 패턴)
  elements: {
    stockStatus: null,
    productSelect: null,
    addToCartButton: null,
    cartDisplay: null,
  },

  // 상태 값 (React의 useState와 동일한 패턴)
  state: {
    lastSelectedProductId: null,
  },

  // DOM 요소 접근자
  getElement(elementName) {
    return this.elements[elementName];
  },

  setElement(elementName, element) {
    this.elements[elementName] = element;
  },

  // 상태 접근자
  getState(stateName) {
    return this.state[stateName];
  },

  setState(stateName, value) {
    this.state[stateName] = value;
  },
};

const PRODUCT_IDS = {
  KEYBOARD: "p1",
  MOUSE: "p2",
  MONITOR_ARM: "p3",
  LAPTOP_POUCH: "p4",
  SPEAKER: "p5",
};

const DISCOUNT_RULES = {
  // 개별 상품 할인 임계값 및 할인율 (백분율로 저장)
  ITEM_DISCOUNT_THRESHOLD: 10,
  ITEM_DISCOUNT_RATES: {
    [PRODUCT_IDS.KEYBOARD]: 10,
    [PRODUCT_IDS.MOUSE]: 15,
    [PRODUCT_IDS.MONITOR_ARM]: 20,
    [PRODUCT_IDS.LAPTOP_POUCH]: 5,
    [PRODUCT_IDS.SPEAKER]: 25,
  },

  // 대량 구매 할인
  BULK_DISCOUNT_THRESHOLD: 30,
  BULK_DISCOUNT_RATE: 25, // 25%

  // 특별 할인 요일 설정
  SPECIAL_DISCOUNT_DAYS: [2],
  SPECIAL_DISCOUNT_RATE: 10,

  // 특별 세일
  LIGHTNING_SALE_RATE: 20,
  RECOMMENDATION_DISCOUNT_RATE: 5,
};

// 재고 관리 상수
const STOCK_THRESHOLDS = {
  LOW_STOCK_WARNING: 5, // 재고 부족 경고
  TOTAL_STOCK_WARNING: 50, // 전체 재고 경고
  TOTAL_STOCK_CRITICAL: 30, // 전체 재고 위험
};

// 포인트 적립 상수
const POINTS_RULES = {
  BASE_CALCULATION_UNIT: 1000, // 1000원당 1포인트

  // 특별 포인트 요일 설정
  SPECIAL_POINTS_DAYS: [2],
  SPECIAL_POINTS_MULTIPLIER: 2, // 2배

  // 세트 구매 보너스
  COMBO_BONUS: {
    KEYBOARD_MOUSE: 50,
    FULL_SET: 100,
  },

  // 수량별 보너스
  QUANTITY_BONUS: {
    TIER_1: { threshold: 10, bonus: 20 },
    TIER_2: { threshold: 20, bonus: 50 },
    TIER_3: { threshold: 30, bonus: 100 },
  },
};

/**
 * 특별 할인 요일 체크
 * @param {Date} date
 * @returns {boolean}
 */
const isSpecialDiscountDay = (date = new Date()) => {
  return DISCOUNT_RULES.SPECIAL_DISCOUNT_DAYS.includes(date.getDay());
};

/**
 * 특별 포인트 요일 체크
 * @param {Date} date
 * @returns {boolean}
 */
const isSpecialPointsDay = (date = new Date()) => {
  return POINTS_RULES.SPECIAL_POINTS_DAYS.includes(date.getDay());
};

/**
 * 요일 이름 추출
 * @param {number} dayIndex
 * @returns {string} 요일 이름
 */
const getKoreanDayName = (dayIndex) => {
  if (dayIndex === 0) return "일요일";
  if (dayIndex === 1) return "월요일";
  if (dayIndex === 2) return "화요일";
  if (dayIndex === 3) return "수요일";
  if (dayIndex === 4) return "목요일";
  if (dayIndex === 5) return "금요일";
  if (dayIndex === 6) return "토요일";
  return "";
};

// ✅ 특별 세일 타이머 상수
const SALE_INTERVALS = {
  LIGHTNING_SALE_INTERVAL: 30000, // 30초마다 번개세일
  RECOMMENDATION_INTERVAL: 60000, // 60초마다 추천할인
  LIGHTNING_SALE_INITIAL_DELAY: 10000, // 최대 10초 후 첫 번째 세일 시작
};

// 상품 데이터 관리
const useProductData = {
  products: [
    {
      id: PRODUCT_IDS.KEYBOARD,
      name: "버그 없애는 키보드",
      val: 10000,
      originalVal: 10000,
      q: 50,
      onSale: false,
      suggestSale: false,
    },
    {
      id: PRODUCT_IDS.MOUSE,
      name: "생산성 폭발 마우스",
      val: 20000,
      originalVal: 20000,
      q: 30,
      onSale: false,
      suggestSale: false,
    },
    {
      id: PRODUCT_IDS.MONITOR_ARM,
      name: "거북목 탈출 모니터암",
      val: 30000,
      originalVal: 30000,
      q: 20,
      onSale: false,
      suggestSale: false,
    },
    {
      id: PRODUCT_IDS.LAPTOP_POUCH,
      name: "에러 방지 노트북 파우치",
      val: 15000,
      originalVal: 15000,
      q: 0,
      onSale: false,
      suggestSale: false,
    },
    {
      id: PRODUCT_IDS.SPEAKER,
      name: `코딩할 때 듣는 Lo-Fi 스피커`,
      val: 25000,
      originalVal: 25000,
      q: 10,
      onSale: false,
      suggestSale: false,
    },
  ],

  /**
   * 상품 목록 반환
   * @returns {Array} 상품 목록 배열
   */
  getProducts() {
    return [...this.products];
  },

  /**
   * 총 재고 계산
   * @returns {number} 총 재고 수량
   */
  getTotalStock() {
    return this.products.reduce((total, product) => total + product.q);
  },

  /**
   * 상품 ID로 상품 찾기
   * @param {string} id - 상품 ID
   * @returns {Object|null} 찾은 상품 객체 또는 null
   */
  findProductById(id) {
    return this.products.find((product) => product.id === id) || null;
  },

  /**
   * 상품 재고 수량 업데이트 (불변 업데이트)
   * @param {string} id - 상품 ID
   * @param {number} stockChange - 재고 변경량 (음수면 감소, 양수면 증가)
   * @returns {boolean} 업데이트 성공 여부
   */
  updateProductStock(id, stockChange) {
    const productIndex = this.products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      return false;
    }

    const currentProduct = this.products[productIndex];
    const newStock = currentProduct.q + stockChange;

    if (newStock < 0) {
      return false; // 재고가 음수가 될 수 없음
    }

    // 불변 업데이트: 새 객체로 교체
    this.products[productIndex] = {
      ...currentProduct,
      q: newStock,
    };

    return true;
  },

  /**
   * 상품 가격 업데이트 (불변 업데이트)
   * @param {string} id - 상품 ID
   * @param {number} newPrice - 새로운 가격
   * @returns {boolean} 업데이트 성공 여부
   */
  updateProductPrice(id, newPrice) {
    const productIndex = this.products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      return false;
    }

    const currentProduct = this.products[productIndex];

    // 불변 업데이트: 새 객체로 교체
    this.products[productIndex] = {
      ...currentProduct,
      val: newPrice,
    };

    return true;
  },

  /**
   * 상품 세일 상태 업데이트 (불변 업데이트)
   * @param {string} id - 상품 ID
   * @param {Object} saleUpdates - 세일 상태 업데이트 객체
   * @param {boolean} [saleUpdates.onSale] - 번개세일 상태
   * @param {boolean} [saleUpdates.suggestSale] - 추천세일 상태
   * @returns {boolean} 업데이트 성공 여부
   */
  updateProductSaleStatus(id, saleUpdates) {
    const productIndex = this.products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      return false;
    }

    const currentProduct = this.products[productIndex];

    // 불변 업데이트: 새 객체로 교체
    this.products[productIndex] = {
      ...currentProduct,
      ...saleUpdates, // onSale, suggestSale 등을 선택적으로 업데이트
    };

    return true;
  },

  /**
   * 상품 추천 할인 적용 (불변 업데이트)
   * @param {string} id - 상품 ID
   * @param {number} discountRate - 할인율 (백분율)
   * @returns {boolean} 업데이트 성공 여부
   */
  applyRecommendationDiscount(id, discountRate) {
    const productIndex = this.products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      return false;
    }

    const currentProduct = this.products[productIndex];
    const discountedPrice = Math.round((currentProduct.val * (100 - discountRate)) / 100);

    // 불변 업데이트: 새 객체로 교체
    this.products[productIndex] = {
      ...currentProduct,
      val: discountedPrice,
      suggestSale: true,
    };

    return true;
  },
};

// ✅ 재고 관리 캡슐화 (나중에 useStock hook으로 변환 예정)
const useStockManager = {
  /**
   * 재고 경고 메시지 생성
   * @returns {string} 재고 경고 메시지
   */
  generateStockWarningMessage() {
    const products = useProductData.getProducts();
    let warningMsg = "";

    products.forEach((item) => {
      if (item.q < STOCK_THRESHOLDS.LOW_STOCK_WARNING) {
        if (item.q > 0) {
          warningMsg += `${item.name}: 재고 부족 (${item.q}개 남음)\n`;
        } else {
          warningMsg += `${item.name}: 품절\n`;
        }
      }
    });

    return warningMsg;
  },

  /**
   * 재고 정보 UI 업데이트
   */
  updateStockInfoDisplay() {
    const warningMessage = this.generateStockWarningMessage();
    const stockInfoElement = document.getElementById("stock-status");
    if (stockInfoElement) {
      stockInfoElement.textContent = warningMessage;
    }
  },
};

// ✅ 장바구니 관리 캡슐화 (나중에 useCart hook으로 변환 예정)
const useCartManager = {
  // 내부 상태
  totalAmount: 0,
  itemCount: 0,

  /**
   * 장바구니 총 금액 반환
   * @returns {number} 총 금액
   */
  getTotalAmount() {
    return this.totalAmount;
  },

  /**
   * 장바구니 총 상품 개수 반환
   * @returns {number} 상품 개수
   */
  getItemCount() {
    return this.itemCount;
  },

  /**
   * 장바구니 상태 초기화
   */
  resetCart() {
    this.totalAmount = 0;
    this.itemCount = 0;
  },

  /**
   * 장바구니 총액과 개수 설정 (내부용)
   * @param {number} amount - 총 금액
   * @param {number} count - 상품 개수
   */
  setCartTotals(amount, count) {
    this.totalAmount = amount;
    this.itemCount = count;
  },

  /**
   * 장바구니 아이템들로부터 총액과 개수 계산
   * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
   * @returns {Object} 계산 결과 {subtotal, itemCount, itemDiscounts}
   */
  calculateCartTotals(cartItems) {
    let subtotal = 0;
    let itemCount = 0;
    const itemDiscounts = [];

    for (let i = 0; i < cartItems.length; i += 1) {
      const curItem = useProductData.findProductById(cartItems[i].id);

      if (curItem) {
        const qtyElem = cartItems[i].querySelector(".quantity-number");
        const q = parseInt(qtyElem.textContent, 10);
        const itemTot = curItem.val * q;

        itemCount += q;
        subtotal += itemTot;

        // 개별 상품 할인 적용
        if (q >= DISCOUNT_RULES.ITEM_DISCOUNT_THRESHOLD) {
          const disc = (DISCOUNT_RULES.ITEM_DISCOUNT_RATES[curItem.id] || 0) / 100;
          if (disc > 0) {
            itemDiscounts.push({
              name: curItem.name,
              discount: DISCOUNT_RULES.ITEM_DISCOUNT_RATES[curItem.id],
            });
          }
        }
      }
    }

    return {
      subtotal,
      itemCount,
      itemDiscounts,
    };
  },

  /**
   * 총 할인율 계산 (대량 구매 할인, 화요일 할인 포함)
   * @param {number} subtotal - 소계
   * @param {number} itemCount - 상품 개수
   * @param {Array} itemDiscounts - 개별 상품 할인 목록
   * @returns {Object} {totalAmount, discountRate, originalTotal}
   */
  calculateFinalAmount(subtotal, itemCount, itemDiscounts) {
    let totalAmount = subtotal;
    let discountRate = 0;
    const originalTotal = subtotal;

    // 개별 상품 할인 적용
    if (itemCount < DISCOUNT_RULES.BULK_DISCOUNT_THRESHOLD) {
      itemDiscounts.forEach((item) => {
        const discountAmount = subtotal * (item.discount / 100);
        totalAmount -= discountAmount;
      });
      discountRate = (subtotal - totalAmount) / subtotal;
    }

    // 대량 구매 할인 적용
    if (itemCount >= DISCOUNT_RULES.BULK_DISCOUNT_THRESHOLD) {
      totalAmount = subtotal * (1 - DISCOUNT_RULES.BULK_DISCOUNT_RATE / 100);
      discountRate = DISCOUNT_RULES.BULK_DISCOUNT_RATE / 100;
    }

    // 화요일 특별 할인 적용
    const today = new Date();
    const isSpecialDiscount = isSpecialDiscountDay(today);
    if (isSpecialDiscount && totalAmount > 0) {
      totalAmount *= 1 - DISCOUNT_RULES.SPECIAL_DISCOUNT_RATE / 100;
      discountRate = 1 - totalAmount / originalTotal;
    }

    return {
      totalAmount: Math.round(totalAmount),
      discountRate,
      originalTotal,
      isSpecialDiscount,
    };
  },

  /**
   * 장바구니 전체 계산 실행 및 상태 업데이트
   * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
   * @returns {Object} 계산 결과
   */
  updateCartCalculation(cartItems) {
    // 1. 기본 계산
    const basicCalculation = this.calculateCartTotals(cartItems);

    // 2. 최종 금액 계산
    const finalCalculation = this.calculateFinalAmount(
      basicCalculation.subtotal,
      basicCalculation.itemCount,
      basicCalculation.itemDiscounts,
    );

    // 3. 내부 상태 업데이트
    this.setCartTotals(finalCalculation.totalAmount, basicCalculation.itemCount);

    // 4. 전체 결과 반환
    return {
      ...basicCalculation,
      ...finalCalculation,
    };
  },
};

// ✅ 보너스 포인트 관리 캡슐화 (나중에 useBonusPoints hook으로 변환 예정)
const useBonusPointsManager = {
  // 내부 상태
  bonusPoints: 0,

  /**
   * 현재 보너스 포인트 반환
   * @returns {number} 보너스 포인트
   */
  getBonusPoints() {
    return this.bonusPoints;
  },

  /**
   * 보너스 포인트 설정
   * @param {number} points - 설정할 포인트
   */
  setBonusPoints(points) {
    this.bonusPoints = points;
  },

  /**
   * 보너스 포인트 초기화
   */
  resetBonusPoints() {
    this.bonusPoints = 0;
  },

  /**
   * 기본 포인트 계산 (구매액 기준)
   * @param {number} totalAmount - 총 구매액
   * @returns {number} 기본 포인트
   */
  calculateBasePoints(totalAmount) {
    return Math.floor(totalAmount / POINTS_RULES.BASE_CALCULATION_UNIT);
  },

  /**
   * 특별 포인트 날짜 보너스 계산
   * @param {number} basePoints - 기본 포인트
   * @returns {Object} {points, isSpecialDay, detail}
   */
  calculateSpecialDayBonus(basePoints) {
    const isSpecialDay = isSpecialPointsDay();

    if (isSpecialDay && basePoints > 0) {
      const bonusPoints = basePoints * POINTS_RULES.SPECIAL_POINTS_MULTIPLIER;
      const detail = `${POINTS_RULES.SPECIAL_POINTS_DAYS.map(getKoreanDayName).join(", ")} ${POINTS_RULES.SPECIAL_POINTS_MULTIPLIER}배`;

      return {
        points: bonusPoints,
        isSpecialDay: true,
        detail,
      };
    }

    return {
      points: basePoints,
      isSpecialDay: false,
      detail: basePoints > 0 ? `기본: ${basePoints}p` : "",
    };
  },

  /**
   * 장바구니 아이템들로부터 콤보 보너스 계산
   * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
   * @returns {Object} {bonusPoints, details}
   */
  calculateComboBonus(cartItems) {
    let bonusPoints = 0;
    const details = [];

    // 장바구니에서 상품 종류 확인
    let hasKeyboard = false;
    let hasMouse = false;
    let hasMonitorArm = false;

    Array.from(cartItems).forEach((node) => {
      const product = useProductData.findProductById(node.id);
      if (product) {
        if (product.id === PRODUCT_IDS.KEYBOARD) {
          hasKeyboard = true;
        } else if (product.id === PRODUCT_IDS.MOUSE) {
          hasMouse = true;
        } else if (product.id === PRODUCT_IDS.MONITOR_ARM) {
          hasMonitorArm = true;
        }
      }
    });

    // 콤보 보너스 적용
    if (hasKeyboard && hasMouse) {
      bonusPoints += POINTS_RULES.COMBO_BONUS.KEYBOARD_MOUSE;
      details.push(`키보드+마우스 세트 +${POINTS_RULES.COMBO_BONUS.KEYBOARD_MOUSE}p`);
    }

    if (hasKeyboard && hasMouse && hasMonitorArm) {
      bonusPoints += POINTS_RULES.COMBO_BONUS.FULL_SET;
      details.push(`풀세트 구매 +${POINTS_RULES.COMBO_BONUS.FULL_SET}p`);
    }

    return {
      bonusPoints,
      details,
    };
  },

  /**
   * 수량별 보너스 포인트 계산
   * @param {number} totalItemCount - 총 상품 개수
   * @returns {Object} {bonusPoints, detail}
   */
  calculateQuantityBonus(totalItemCount) {
    let bonusPoints = 0;
    let detail = "";

    if (totalItemCount >= POINTS_RULES.QUANTITY_BONUS.TIER_3.threshold) {
      bonusPoints = POINTS_RULES.QUANTITY_BONUS.TIER_3.bonus;
      detail = `대량구매(${POINTS_RULES.QUANTITY_BONUS.TIER_3.threshold}개+) +${POINTS_RULES.QUANTITY_BONUS.TIER_3.bonus}p`;
    } else if (totalItemCount >= POINTS_RULES.QUANTITY_BONUS.TIER_2.threshold) {
      bonusPoints = POINTS_RULES.QUANTITY_BONUS.TIER_2.bonus;
      detail = `대량구매(${POINTS_RULES.QUANTITY_BONUS.TIER_2.threshold}개+) +${POINTS_RULES.QUANTITY_BONUS.TIER_2.bonus}p`;
    } else if (totalItemCount >= POINTS_RULES.QUANTITY_BONUS.TIER_1.threshold) {
      bonusPoints = POINTS_RULES.QUANTITY_BONUS.TIER_1.bonus;
      detail = `대량구매(${POINTS_RULES.QUANTITY_BONUS.TIER_1.threshold}개+) +${POINTS_RULES.QUANTITY_BONUS.TIER_1.bonus}p`;
    }

    return {
      bonusPoints,
      detail,
    };
  },

  /**
   * 전체 보너스 포인트 계산 및 업데이트
   * @param {number} totalAmount - 총 구매액
   * @param {number} totalItemCount - 총 상품 개수
   * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
   * @returns {Object} 계산 결과 및 상세 정보
   */
  calculateAndUpdateBonusPoints(totalAmount, totalItemCount, cartItems) {
    const details = [];

    // 1. 기본 포인트 계산
    const basePoints = this.calculateBasePoints(totalAmount);

    // 2. 특별 날짜 보너스 적용
    const specialDayResult = this.calculateSpecialDayBonus(basePoints);
    let finalPoints = specialDayResult.points;
    if (specialDayResult.detail) {
      details.push(specialDayResult.detail);
    }

    // 3. 콤보 보너스 적용
    const comboResult = this.calculateComboBonus(cartItems);
    finalPoints += comboResult.bonusPoints;
    details.push(...comboResult.details);

    // 4. 수량별 보너스 적용
    const quantityResult = this.calculateQuantityBonus(totalItemCount);
    finalPoints += quantityResult.bonusPoints;
    if (quantityResult.detail) {
      details.push(quantityResult.detail);
    }

    // 5. 내부 상태 업데이트
    this.setBonusPoints(finalPoints);

    return {
      totalPoints: finalPoints,
      details,
      breakdown: {
        base: basePoints,
        specialDay: specialDayResult,
        combo: comboResult,
        quantity: quantityResult,
      },
    };
  },
};

// cartDisplayElement와 cartSummaryElement는 useDOMManager로 이동됨

/**
 * 장바구니 아이템들의 할인 표시 스타일 업데이트
 * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
 */
function updateCartItemStyles(cartItems) {
  for (let i = 0; i < cartItems.length; i += 1) {
    const curItem = useProductData.findProductById(cartItems[i].id);

    if (curItem) {
      const qtyElem = cartItems[i].querySelector(".quantity-number");
      const q = parseInt(qtyElem.textContent, 10);
      const itemDiv = cartItems[i];
      const priceElems = itemDiv.querySelectorAll(".text-lg, .text-xs");

      priceElems.forEach(function (elem) {
        if (elem.classList.contains("text-lg")) {
          const newFontWeight = q >= DISCOUNT_RULES.ITEM_DISCOUNT_THRESHOLD ? "bold" : "normal";
          if (elem.style.fontWeight !== newFontWeight) {
            const targetElement = elem;
            targetElement.style.fontWeight = newFontWeight;
          }
        }
      });
    }
  }
}

/**
 * 화요일 특별 할인 UI 표시 업데이트
 * @param {boolean} isSpecialDiscount - 특별 할인 여부
 * @param {number} totalAmount - 총 금액
 */
function updateSpecialDiscountDisplay(isSpecialDiscount, totalAmount) {
  const tuesdaySpecial = document.getElementById("tuesday-special");

  if (isSpecialDiscount && totalAmount > 0) {
    tuesdaySpecial.classList.remove("hidden");
  } else {
    tuesdaySpecial.classList.add("hidden");
  }
}

/**
 * 상품 개수 표시 업데이트
 * @param {number} itemCount - 총 상품 개수
 */
function updateItemCountDisplay(itemCount) {
  const itemCountElement = document.getElementById("item-count");

  if (itemCountElement) {
    const previousCount = parseInt(itemCountElement.textContent.match(/\d+/) || [0], 10);
    itemCountElement.textContent = `🛍️ ${itemCount} items in cart`;

    if (previousCount !== itemCount) {
      itemCountElement.setAttribute("data-changed", "true");
    }
  }
}

/**
 * 주문 요약 데이터 계산 (순수 함수)
 * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
 * @param {number} subtotal - 소계
 * @param {number} itemCount - 총 상품 개수
 * @param {Array} itemDiscounts - 개별 상품 할인 목록
 * @param {boolean} isSpecialDiscount - 특별 할인 여부
 * @param {number} totalAmount - 총 금액
 * @returns {Object} 주문 요약 데이터
 */
function calculateOrderSummaryData(cartItems, subtotal, itemCount, itemDiscounts, isSpecialDiscount, totalAmount) {
  // 개별 상품 목록 데이터 계산
  const items = [];
  for (let i = 0; i < cartItems.length; i += 1) {
    const curItem = useProductData.findProductById(cartItems[i].id);
    if (curItem) {
      const qtyElem = cartItems[i].querySelector(".quantity-number");
      const quantity = parseInt(qtyElem.textContent, 10);
      const itemTotal = curItem.val * quantity;

      items.push({
        name: curItem.name,
        quantity,
        itemTotal,
      });
    }
  }

  // 할인 정보 데이터 계산
  const discounts = {
    hasBulkDiscount: itemCount >= DISCOUNT_RULES.BULK_DISCOUNT_THRESHOLD,
    bulkDiscountRate: DISCOUNT_RULES.BULK_DISCOUNT_RATE,
    bulkDiscountThreshold: DISCOUNT_RULES.BULK_DISCOUNT_THRESHOLD,
    itemDiscounts,
    itemDiscountThreshold: DISCOUNT_RULES.ITEM_DISCOUNT_THRESHOLD,
    hasSpecialDiscount: isSpecialDiscount && totalAmount > 0,
    specialDiscountDays: DISCOUNT_RULES.SPECIAL_DISCOUNT_DAYS.map(getKoreanDayName).join(", "),
    specialDiscountRate: DISCOUNT_RULES.SPECIAL_DISCOUNT_RATE,
  };

  return {
    items,
    subtotal,
    discounts,
    shouldRender: subtotal > 0,
  };
}

/**
 * 주문 요약 HTML 템플릿 생성 (순수 함수)
 * @param {Object} summaryData - 주문 요약 데이터
 * @returns {string} HTML 템플릿 문자열
 */
function createOrderSummaryHTML(summaryData) {
  if (!summaryData.shouldRender) {
    return "";
  }

  // 개별 상품 목록 HTML
  const itemsHTML = summaryData.items
    .map(
      (item) => `
      <div class="flex justify-between text-xs tracking-wide text-gray-400">
        <span>${item.name} x ${item.quantity}</span>
        <span>₩${item.itemTotal.toLocaleString()}</span>
      </div>
    `,
    )
    .join("");

  // 소계 HTML
  const subtotalHTML = `
    <div class="border-t border-white/10 my-3"></div>
    <div class="flex justify-between text-sm tracking-wide">
      <span>Subtotal</span>
      <span>₩${summaryData.subtotal.toLocaleString()}</span>
    </div>
  `;

  // 할인 정보 HTML
  let discountsHTML = "";

  if (summaryData.discounts.hasBulkDiscount) {
    discountsHTML += `
      <div class="flex justify-between text-sm tracking-wide text-green-400">
        <span class="text-xs">🎉 대량구매 할인 (${summaryData.discounts.bulkDiscountThreshold}개 이상)</span>
        <span class="text-xs">-${summaryData.discounts.bulkDiscountRate}%</span>
      </div>
    `;
  } else if (summaryData.discounts.itemDiscounts.length > 0) {
    summaryData.discounts.itemDiscounts.forEach(function (item) {
      discountsHTML += `
        <div class="flex justify-between text-sm tracking-wide text-green-400">
          <span class="text-xs">${item.name} (${summaryData.discounts.itemDiscountThreshold}개↑)</span>
          <span class="text-xs">-${item.discount}%</span>
        </div>
      `;
    });
  }

  // 특별 할인 HTML
  let specialDiscountHTML = "";
  if (summaryData.discounts.hasSpecialDiscount) {
    specialDiscountHTML = `
      <div class="flex justify-between text-sm tracking-wide text-purple-400">
        <span class="text-xs">🌟 ${summaryData.discounts.specialDiscountDays} 추가 할인</span>
        <span class="text-xs">-${summaryData.discounts.specialDiscountRate}%</span>
      </div>
    `;
  }

  return itemsHTML + subtotalHTML + discountsHTML + specialDiscountHTML;
}

/**
 * 주문 요약 렌더러 객체
 * DOM 조작만 담당
 */
const OrderSummaryRenderer = {
  /**
   * 주문 요약 렌더링
   * @param {Object} summaryData - 주문 요약 데이터
   */
  render(summaryData) {
    const summaryDetails = document.getElementById("summary-details");
    summaryDetails.innerHTML = "";

    if (!summaryData.shouldRender) {
      return;
    }

    const html = createOrderSummaryHTML(summaryData);
    summaryDetails.innerHTML = html;
  },
};

/**
 * 주문 요약 세부 정보 렌더링 (리팩토링된 버전)
 * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
 * @param {number} subtotal - 소계
 * @param {number} itemCount - 총 상품 개수
 * @param {Array} itemDiscounts - 개별 상품 할인 목록
 * @param {boolean} isSpecialDiscount - 특별 할인 여부
 * @param {number} totalAmount - 총 금액
 */
function renderOrderSummaryDetails(cartItems, subtotal, itemCount, itemDiscounts, isSpecialDiscount, totalAmount) {
  const summaryData = calculateOrderSummaryData(
    cartItems,
    subtotal,
    itemCount,
    itemDiscounts,
    isSpecialDiscount,
    totalAmount,
  );
  OrderSummaryRenderer.render(summaryData);
}

/**
 * 총액 및 포인트 표시 데이터 계산 (순수 함수)
 * @param {number} totalAmount - 총 금액
 * @returns {Object} 총액 및 포인트 표시 데이터
 */
function calculateTotalAndPointsData(totalAmount) {
  const formattedTotal = `₩${totalAmount.toLocaleString()}`;
  const points = Math.floor(totalAmount / POINTS_RULES.BASE_CALCULATION_UNIT);

  return {
    totalText: formattedTotal,
    points,
    pointsText: `적립 포인트: ${points}p`,
    shouldShowPoints: true,
  };
}

/**
 * 총액 및 포인트 렌더러 객체
 * DOM 조작만 담당
 */
const TotalPointsRenderer = {
  /**
   * 총액 및 포인트 표시 렌더링
   * @param {Object} displayData - 표시 데이터
   */
  render(displayData) {
    // DOM 요소 가져오기 (useDOMManager 사용)
    const cartSummaryElement = useDOMManager.getElement("cartSummary");

    const totalDiv = cartSummaryElement.querySelector(".text-2xl");
    const loyaltyPointsDiv = document.getElementById("loyalty-points");

    // 총액 표시
    if (totalDiv) {
      totalDiv.textContent = displayData.totalText;
    }

    // 포인트 표시
    if (loyaltyPointsDiv && displayData.shouldShowPoints) {
      loyaltyPointsDiv.textContent = displayData.pointsText;
      loyaltyPointsDiv.style.display = "block";
    }
  },
};

/**
 * 총액 및 포인트 표시 업데이트 (리팩토링된 버전)
 * @param {number} totalAmount - 총 금액
 */
function updateTotalAndPointsDisplay(totalAmount) {
  const displayData = calculateTotalAndPointsData(totalAmount);
  TotalPointsRenderer.render(displayData);
}

/**
 * 할인 정보 데이터 계산 (순수 함수)
 * @param {number} discountRate - 할인율
 * @param {number} totalAmount - 총 금액
 * @param {number} originalTotal - 원래 총액
 * @returns {Object} 할인 정보 데이터
 */
function calculateDiscountInfoData(discountRate, totalAmount, originalTotal) {
  const hasDiscount = discountRate > 0 && totalAmount > 0;
  const savedAmount = hasDiscount ? originalTotal - totalAmount : 0;
  const discountPercentage = hasDiscount ? (discountRate * 100).toFixed(1) : "0.0";

  return {
    hasDiscount,
    savedAmount,
    discountPercentage,
    formattedSavedAmount: `₩${Math.round(savedAmount).toLocaleString()}`,
  };
}

/**
 * 할인 정보 HTML 템플릿 생성 (순수 함수)
 * @param {Object} discountData - 할인 정보 데이터
 * @returns {string} HTML 템플릿 문자열
 */
function createDiscountInfoHTML(discountData) {
  if (!discountData.hasDiscount) {
    return "";
  }

  return `
    <div class="bg-green-500/20 rounded-lg p-3">
      <div class="flex justify-between items-center mb-1">
        <span class="text-xs uppercase tracking-wide text-green-400">총 할인율</span>
        <span class="text-sm font-medium text-green-400">${discountData.discountPercentage}%</span>
      </div>
      <div class="text-2xs text-gray-300">${discountData.formattedSavedAmount} 할인되었습니다</div>
    </div>
  `;
}

/**
 * 할인 정보 렌더러 객체
 * DOM 조작만 담당
 */
const DiscountInfoRenderer = {
  /**
   * 할인 정보 패널 렌더링
   * @param {Object} discountData - 할인 정보 데이터
   */
  render(discountData) {
    const discountInfoDiv = document.getElementById("discount-info");
    discountInfoDiv.innerHTML = "";

    if (discountData.hasDiscount) {
      const html = createDiscountInfoHTML(discountData);
      discountInfoDiv.innerHTML = html;
    }
  },
};

/**
 * 할인 정보 패널 렌더링 (리팩토링된 버전)
 * @param {number} discountRate - 할인율
 * @param {number} totalAmount - 총 금액
 * @param {number} originalTotal - 원래 총액
 */
function renderDiscountInfoPanel(discountRate, totalAmount, originalTotal) {
  const discountData = calculateDiscountInfoData(discountRate, totalAmount, originalTotal);
  DiscountInfoRenderer.render(discountData);
}

/**
 * 상품 선택 옵션 데이터 계산 (순수 함수)
 * @returns {Object} 상품 선택 옵션 데이터
 */
function calculateProductSelectData() {
  const products = useProductData.getProducts();

  // 전체 재고 계산
  let totalStock = 0;
  for (let idx = 0; idx < products.length; idx += 1) {
    const product = products[idx];
    totalStock += product.q;
  }

  // 각 상품별 옵션 데이터 생성
  const optionData = products.map(function (item) {
    let discountText = "";
    if (item.onSale) discountText += " ⚡SALE";
    if (item.suggestSale) discountText += " 💝추천";

    // 상품 상태별 텍스트와 클래스 결정
    let optionText;
    let optionClass;
    let isDisabled;

    if (item.q === 0) {
      optionText = `${item.name} - ${item.val}원 (품절)${discountText}`;
      optionClass = "text-gray-400";
      isDisabled = true;
    } else if (item.onSale && item.suggestSale) {
      const totalDiscountRate = DISCOUNT_RULES.LIGHTNING_SALE_RATE + DISCOUNT_RULES.RECOMMENDATION_DISCOUNT_RATE;
      optionText = `⚡💝${item.name} - ${item.originalVal}원 → ${item.val}원 (${totalDiscountRate}% SUPER SALE!)`;
      optionClass = "text-purple-600 font-bold";
      isDisabled = false;
    } else if (item.onSale) {
      optionText = `⚡${item.name} - ${item.originalVal}원 → ${item.val}원 (${DISCOUNT_RULES.LIGHTNING_SALE_RATE}% SALE!)`;
      optionClass = "text-red-500 font-bold";
      isDisabled = false;
    } else if (item.suggestSale) {
      optionText = `💝${item.name} - ${item.originalVal}원 → ${item.val}원 (${DISCOUNT_RULES.RECOMMENDATION_DISCOUNT_RATE}% 추천할인!)`;
      optionClass = "text-blue-500 font-bold";
      isDisabled = false;
    } else {
      optionText = `${item.name} - ${item.val}원${discountText}`;
      optionClass = "";
      isDisabled = false;
    }

    return {
      id: item.id,
      text: optionText,
      className: optionClass,
      disabled: isDisabled,
    };
  });

  return {
    options: optionData,
    totalStock,
    shouldShowWarning: totalStock < STOCK_THRESHOLDS.TOTAL_STOCK_WARNING,
  };
}

/**
 * 상품 선택 옵션 엘리먼트들 생성 (순수 함수)
 * @param {Object} selectData - 상품 선택 데이터
 * @returns {Array} option 엘리먼트 배열
 */
function createProductSelectOptions(selectData) {
  return selectData.options.map(function (optionData) {
    const opt = document.createElement("option");
    opt.value = optionData.id;
    opt.textContent = optionData.text;
    opt.disabled = optionData.disabled;
    if (optionData.className) {
      opt.className = optionData.className;
    }
    return opt;
  });
}

/**
 * 상품 선택 렌더러 객체
 * DOM 조작만 담당
 */
const ProductSelectRenderer = {
  /**
   * 상품 선택 옵션 렌더링
   * @param {Object} selectData - 상품 선택 데이터
   */
  render(selectData) {
    // DOM 요소 가져오기 (useDOMManager 사용)
    const productSelectElement = useDOMManager.getElement("productSelect");

    // 기존 옵션들 초기화
    productSelectElement.innerHTML = "";

    // 새 옵션들 생성 및 추가
    const options = createProductSelectOptions(selectData);
    options.forEach(function (opt) {
      productSelectElement.appendChild(opt);
    });

    // 재고 부족 경고 표시
    if (selectData.shouldShowWarning) {
      productSelectElement.style.borderColor = "orange";
    } else {
      productSelectElement.style.borderColor = "";
    }
  },
};

/**
 * 상품 선택 옵션 업데이트 (리팩토링된 버전)
 */
function updateProductSelectOptions() {
  const selectData = calculateProductSelectData();
  ProductSelectRenderer.render(selectData);
}

function renderBonusPointsDisplay() {
  // DOM 요소 가져오기 (useDOMManager 사용)
  const cartDisplayElement = useDOMManager.getElement("cartDisplay");

  const totalAmount = useCartManager.getTotalAmount();
  const itemCount = useCartManager.getItemCount();
  const nodes = cartDisplayElement.children;

  if (cartDisplayElement.children.length === 0) {
    document.getElementById("loyalty-points").style.display = "none";
    useBonusPointsManager.resetBonusPoints();
    return;
  }

  // ✅ useBonusPointsManager로 모든 보너스 포인트 계산
  const bonusResult = useBonusPointsManager.calculateAndUpdateBonusPoints(totalAmount, itemCount, nodes);

  const finalPoints = bonusResult.totalPoints;
  const pointsDetail = bonusResult.details;

  // UI 렌더링
  const ptsTag = document.getElementById("loyalty-points");
  if (ptsTag) {
    if (finalPoints > 0) {
      ptsTag.innerHTML =
        `<div>적립 포인트: <span class="font-bold">${finalPoints}p</span></div>` +
        `<div class="text-2xs opacity-70 mt-1">${pointsDetail.join(", ")}</div>`;
      ptsTag.style.display = "block";
    } else {
      ptsTag.textContent = "적립 포인트: 0p";
      ptsTag.style.display = "block";
    }
  }
}

/**
 * 장바구니 계산 및 전체 UI 업데이트
 * 메인 함수: 장바구니 상태 계산 후 모든 UI 컴포넌트 업데이트
 */
function updateCartDisplay() {
  // DOM 요소 가져오기 (useDOMManager 사용)
  const cartDisplayElement = useDOMManager.getElement("cartDisplay");
  const cartItems = cartDisplayElement.children;

  // 1. 장바구니 계산 (비즈니스 로직)
  const calculation = useCartManager.updateCartCalculation(cartItems);
  const { subtotal, itemCount, totalAmount, discountRate, originalTotal, isSpecialDiscount, itemDiscounts } =
    calculation;

  // 2. UI 업데이트 (프레젠테이션 로직)
  updateCartItemStyles(cartItems);
  updateSpecialDiscountDisplay(isSpecialDiscount, totalAmount);
  updateItemCountDisplay(itemCount);
  renderOrderSummaryDetails(cartItems, subtotal, itemCount, itemDiscounts, isSpecialDiscount, totalAmount);
  updateTotalAndPointsDisplay(totalAmount);
  renderDiscountInfoPanel(discountRate, totalAmount, originalTotal);

  // 3. 연관 컴포넌트 업데이트
  useStockManager.updateStockInfoDisplay();
  renderBonusPointsDisplay();
}

/**
 * 장바구니 아이템 가격 표시 데이터 계산 (순수 함수)
 * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
 * @returns {Array} 아이템별 가격 표시 데이터 배열
 */
function calculateCartItemPricesData(cartItems) {
  const itemsData = [];

  for (let i = 0; i < cartItems.length; i += 1) {
    const itemId = cartItems[i].id;
    const product = useProductData.findProductById(itemId);

    if (product) {
      let priceHTML;
      let nameText;
      let priceClassName;

      // 상품 상태별 가격 표시 방식 결정
      if (product.onSale && product.suggestSale) {
        priceHTML = `<span class="line-through text-gray-400">₩${product.originalVal.toLocaleString()}</span> <span class="text-purple-600">₩${product.val.toLocaleString()}</span>`;
        nameText = `⚡💝${product.name}`;
        priceClassName = "text-purple-600";
      } else if (product.onSale) {
        priceHTML = `<span class="line-through text-gray-400">₩${product.originalVal.toLocaleString()}</span> <span class="text-red-500">₩${product.val.toLocaleString()}</span>`;
        nameText = `⚡${product.name}`;
        priceClassName = "text-red-500";
      } else if (product.suggestSale) {
        priceHTML = `<span class="line-through text-gray-400">₩${product.originalVal.toLocaleString()}</span> <span class="text-blue-500">₩${product.val.toLocaleString()}</span>`;
        nameText = `💝${product.name}`;
        priceClassName = "text-blue-500";
      } else {
        priceHTML = `₩${product.val.toLocaleString()}`;
        nameText = product.name;
        priceClassName = "";
      }

      itemsData.push({
        itemIndex: i,
        priceHTML,
        nameText,
        priceClassName,
        isDiscounted: product.onSale || product.suggestSale,
      });
    }
  }

  return itemsData;
}

/**
 * 장바구니 아이템 가격 렌더러 객체
 * DOM 조작만 담당
 */
const CartItemPricesRenderer = {
  /**
   * 장바구니 아이템 가격 표시 렌더링
   * @param {HTMLCollection} cartItems - 장바구니 DOM 아이템들
   * @param {Array} itemsData - 아이템별 가격 표시 데이터
   */
  render(cartItems, itemsData) {
    itemsData.forEach(function (itemData) {
      const cartItem = cartItems[itemData.itemIndex];
      const priceDiv = cartItem.querySelector(".text-lg");
      const nameDiv = cartItem.querySelector("h3");

      if (priceDiv) {
        if (itemData.isDiscounted) {
          priceDiv.innerHTML = itemData.priceHTML;
        } else {
          priceDiv.textContent = itemData.priceHTML;
        }
      }

      if (nameDiv) {
        nameDiv.textContent = itemData.nameText;
      }
    });
  },
};

/**
 * 장바구니 아이템 가격 업데이트 (리팩토링된 버전)
 */
function updateCartItemPrices() {
  // DOM 요소 가져오기 (useDOMManager 사용)
  const cartDisplayElement = useDOMManager.getElement("cartDisplay");
  const cartItems = cartDisplayElement.children;
  const itemsData = calculateCartItemPricesData(cartItems);

  CartItemPricesRenderer.render(cartItems, itemsData);
  updateCartDisplay();
}

/**
 * 앱 상태 초기화
 * 책임: 전역 상태와 매니저 객체들 초기화
 */
function initializeAppState() {
  useDOMManager.setState("lastSelectedProductId", null);
  useCartManager.resetCart();
}

/**
 * 기본 레이아웃 DOM 요소 생성
 * 책임: 헤더, 그리드 컨테이너 생성
 */
function createMainLayoutElements() {
  const root = document.getElementById("app");

  // 헤더 생성
  const header = document.createElement("div");
  header.className = "mb-8";
  header.innerHTML = `
    <h1 class="text-xs font-medium tracking-extra-wide uppercase mb-2">🛒 Hanghae Online Store</h1>
    <div class="text-5xl tracking-tight leading-none">Shopping Cart</div>
    <p id="item-count" class="text-sm text-gray-500 font-normal mt-3">🛍️ 0 items in cart</p>
  `;

  // 그리드 컨테이너 생성
  const gridContainer = document.createElement("div");
  gridContainer.className = "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 flex-1 overflow-hidden";

  return { root, header, gridContainer };
}

/**
 * 좌측 컬럼 (상품 선택 영역) 생성
 * 책임: 상품 선택, 장바구니 추가 버튼, 재고 상태 영역
 */
function createLeftColumnElements() {
  const leftColumn = document.createElement("div");
  leftColumn.className = "bg-white border border-gray-200 p-8 overflow-y-auto";

  const selectorContainer = document.createElement("div");
  selectorContainer.className = "mb-6 pb-6 border-b border-gray-200";

  // 상품 선택 요소들 생성 및 DOM 매니저에 등록
  const productSelect = document.createElement("select");
  productSelect.id = "product-select";
  productSelect.className = "w-full p-3 border border-gray-300 rounded-lg text-base mb-3";
  useDOMManager.setElement("productSelect", productSelect);

  const addToCartBtn = document.createElement("button");
  addToCartBtn.id = "add-to-cart";
  addToCartBtn.innerHTML = "Add to Cart";
  addToCartBtn.className =
    "w-full py-3 bg-black text-white text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-all";
  useDOMManager.setElement("addToCartButton", addToCartBtn);

  const stockStatus = document.createElement("div");
  stockStatus.id = "stock-status";
  stockStatus.className = "text-xs text-red-500 mt-3 whitespace-pre-line";
  useDOMManager.setElement("stockStatus", stockStatus);

  const cartDisplayElement = document.createElement("div");
  cartDisplayElement.id = "cart-items";
  useDOMManager.setElement("cartDisplay", cartDisplayElement);

  // DOM 구조 조립
  selectorContainer.appendChild(productSelect);
  selectorContainer.appendChild(addToCartBtn);
  selectorContainer.appendChild(stockStatus);
  leftColumn.appendChild(selectorContainer);
  leftColumn.appendChild(cartDisplayElement);

  return leftColumn;
}

/**
 * 우측 컬럼 (주문 요약 영역) 생성
 * 책임: 주문 요약, 할인 정보, 총액 표시 영역
 */
function createRightColumnElements() {
  const rightColumn = document.createElement("div");
  rightColumn.className = "bg-black text-white p-8 flex flex-col";
  rightColumn.innerHTML = `
    <h2 class="text-xs font-medium mb-5 tracking-extra-wide uppercase">Order Summary</h2>
    <div class="flex-1 flex flex-col">
      <div id="summary-details" class="space-y-3"></div>
      <div class="mt-auto">
        <div id="discount-info" class="mb-4"></div>
        <div id="cart-total" class="pt-5 border-t border-white/10">
          <div class="flex justify-between items-baseline">
            <span class="text-sm uppercase tracking-wider">Total</span>
            <div class="text-2xl tracking-tight">₩0</div>
          </div>
          <div id="loyalty-points" class="text-xs text-blue-400 mt-2 text-right">적립 포인트: 0p</div>
        </div>
        <div id="tuesday-special" class="mt-4 p-3 bg-white/10 rounded-lg hidden">
          <div class="flex items-center gap-2">
            <span class="text-2xs">🎉</span>
            <span class="text-xs uppercase tracking-wide">Tuesday Special 10% Applied</span>
          </div>
        </div>
      </div>
    </div>
    <button class="w-full py-4 bg-white text-black text-sm font-normal uppercase tracking-super-wide cursor-pointer mt-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30">
      Proceed to Checkout
    </button>
    <p class="mt-4 text-2xs text-white/60 text-center leading-relaxed">
      Free shipping on all orders.<br>
      <span id="points-notice">Earn loyalty points with purchase.</span>
    </p>
  `;

  const cartSummaryElement = rightColumn.querySelector("#cart-total");
  useDOMManager.setElement("cartSummary", cartSummaryElement);

  return rightColumn;
}

/**
 * 수동 오버레이 (도움말) 요소 생성
 * 책임: 도움말 버튼, 오버레이, 사이드바 패널
 */
function createManualOverlayElements() {
  const manualToggle = document.createElement("button");
  manualToggle.className =
    "fixed top-4 right-4 bg-black text-white p-3 rounded-full hover:bg-gray-900 transition-colors z-50";
  manualToggle.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  `;

  const manualOverlay = document.createElement("div");
  manualOverlay.className = "fixed inset-0 bg-black/50 z-40 hidden transition-opacity duration-300";

  const manualColumn = document.createElement("div");
  manualColumn.className =
    "fixed right-0 top-0 h-full w-80 bg-white shadow-2xl p-6 overflow-y-auto z-50 transform translate-x-full transition-transform duration-300";
  manualColumn.innerHTML = `
    <button class="absolute top-4 right-4 text-gray-500 hover:text-black" onclick="document.querySelector('.fixed.inset-0').classList.add('hidden'); this.parentElement.classList.add('translate-x-full')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
    <h2 class="text-xl font-bold mb-4">📖 이용 안내</h2>
    <div class="mb-6">
      <h3 class="text-base font-bold mb-3">💰 할인 정책</h3>
      <div class="space-y-3">
        <div class="bg-gray-100 rounded-lg p-3">
          <p class="font-semibold text-sm mb-1">개별 상품</p>
          <p class="text-gray-700 text-xs pl-2">
            • 키보드 10개↑: 10%<br>
            • 마우스 10개↑: 15%<br>
            • 모니터암 10개↑: 20%<br>
            • 스피커 10개↑: 25%
          </p>
        </div>
        <div class="bg-gray-100 rounded-lg p-3">
          <p class="font-semibold text-sm mb-1">전체 수량</p>
          <p class="text-gray-700 text-xs pl-2">• 30개 이상: 25%</p>
        </div>
        <div class="bg-gray-100 rounded-lg p-3">
          <p class="font-semibold text-sm mb-1">특별 할인</p>
          <p class="text-gray-700 text-xs pl-2">
            • 화요일: +10%<br>
            • ⚡번개세일: 20%<br>
            • 💝추천할인: 5%
          </p>
        </div>
      </div>
    </div>
    <div class="mb-6">
      <h3 class="text-base font-bold mb-3">🎁 포인트 적립</h3>
      <div class="space-y-3">
        <div class="bg-gray-100 rounded-lg p-3">
          <p class="font-semibold text-sm mb-1">기본</p>
          <p class="text-gray-700 text-xs pl-2">• 구매액의 0.1%</p>
        </div>
        <div class="bg-gray-100 rounded-lg p-3">
          <p class="font-semibold text-sm mb-1">추가</p>
          <p class="text-gray-700 text-xs pl-2">
            • 화요일: 2배<br>
            • 키보드+마우스: +50p<br>
            • 풀세트: +100p<br>
            • 10개↑: +20p / 20개↑: +50p / 30개↑: +100p
          </p>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-200 pt-4 mt-4">
      <p class="text-xs font-bold mb-1">💡 TIP</p>
      <p class="text-2xs text-gray-600 leading-relaxed">
        • 화요일 대량구매 = MAX 혜택<br>
        • ⚡+💝 중복 가능<br>
        • 상품4 = 품절
      </p>
    </div>
  `;

  // 이벤트 핸들러 설정
  manualToggle.onclick = function () {
    manualOverlay.classList.toggle("hidden");
    manualColumn.classList.toggle("translate-x-full");
  };

  manualOverlay.onclick = function (e) {
    if (e.target === manualOverlay) {
      manualOverlay.classList.add("hidden");
      manualColumn.classList.add("translate-x-full");
    }
  };

  manualOverlay.appendChild(manualColumn);

  return { manualToggle, manualOverlay };
}

/**
 * 특별 세일 타이머 시작
 * 책임: 번개세일과 추천할인 타이머 설정
 */
function startSpecialSaleTimers() {
  // 번개세일 타이머
  const lightningDelay = Math.random() * SALE_INTERVALS.LIGHTNING_SALE_INITIAL_DELAY;
  setTimeout(() => {
    setInterval(function () {
      const products = useProductData.getProducts();
      const luckyIdx = Math.floor(Math.random() * products.length);
      const luckyItem = products[luckyIdx];

      if (luckyItem && luckyItem.q > 0 && !luckyItem.onSale) {
        const discountedPrice = Math.round((luckyItem.originalVal * (100 - DISCOUNT_RULES.LIGHTNING_SALE_RATE)) / 100);
        useProductData.updateProductSaleStatus(luckyItem.id, {
          val: discountedPrice,
          onSale: true,
        });

        alert(`⚡번개세일! ${luckyItem.name}이(가) ${DISCOUNT_RULES.LIGHTNING_SALE_RATE}% 할인 중입니다!`);
        updateProductSelectOptions();
        updateCartItemPrices();
      }
    }, SALE_INTERVALS.LIGHTNING_SALE_INTERVAL);
  }, lightningDelay);

  // 추천할인 타이머
  setTimeout(function () {
    setInterval(function () {
      const cartDisplay = useDOMManager.getElement("cartDisplay");
      const lastSelectedProductId = useDOMManager.getState("lastSelectedProductId");

      if (!cartDisplay || cartDisplay.children.length === 0 || !lastSelectedProductId) {
        return;
      }

      const products = useProductData.getProducts();
      const isNotLastSelected = (product) => product.id !== lastSelectedProductId;
      const isInStock = (product) => product.q > 0;
      const isNotSuggested = (product) => !product.suggestSale;

      const suggest = products.find(
        (product) => isNotLastSelected(product) && isInStock(product) && isNotSuggested(product),
      );

      if (suggest) {
        alert(
          `💝 ${suggest.name}은(는) 어떠세요? 지금 구매하시면 ${DISCOUNT_RULES.RECOMMENDATION_DISCOUNT_RATE}% 추가 할인!`,
        );
        useProductData.applyRecommendationDiscount(suggest.id, DISCOUNT_RULES.RECOMMENDATION_DISCOUNT_RATE);
        updateProductSelectOptions();
        updateCartItemPrices();
      }
    }, SALE_INTERVALS.RECOMMENDATION_INTERVAL);
  }, Math.random() * 20000);
}

/**
 * 메인 앱 초기화 함수 (오케스트레이터)
 * 책임: 전체 앱 초기화 과정 조율
 */
function main() {
  // 1. 상태 초기화
  initializeAppState();

  // 2. DOM 요소 생성
  const { root, header, gridContainer } = createMainLayoutElements();
  const leftColumn = createLeftColumnElements();
  const rightColumn = createRightColumnElements();
  const { manualToggle, manualOverlay } = createManualOverlayElements();

  // 3. DOM 구조 조립
  gridContainer.appendChild(leftColumn);
  gridContainer.appendChild(rightColumn);
  root.appendChild(header);
  root.appendChild(gridContainer);
  root.appendChild(manualToggle);
  root.appendChild(manualOverlay);

  // 4. 초기 렌더링
  updateProductSelectOptions();
  updateCartDisplay();

  // 5. 특별 기능 시작
  startSpecialSaleTimers();
}

/**
 * 장바구니 추가 입력 검증 (순수 함수)
 * @param {string} selectedId - 선택된 상품 ID
 * @param {Object} product - 상품 객체
 * @returns {Object} 검증 결과
 */
function validateAddToCartInput(selectedId, product) {
  if (!selectedId || !product) {
    return { isValid: false, reason: "INVALID_SELECTION" };
  }
  if (product.q <= 0) {
    return { isValid: false, reason: "OUT_OF_STOCK" };
  }
  return { isValid: true };
}

/**
 * 상품 표시 데이터 계산 (순수 함수)
 * @param {Object} product - 상품 객체
 * @returns {Object} 표시 데이터
 */
function calculateItemDisplayData(product) {
  let titlePrefix = "";
  if (product.onSale && product.suggestSale) {
    titlePrefix = "⚡💝";
  } else if (product.onSale) {
    titlePrefix = "⚡";
  } else if (product.suggestSale) {
    titlePrefix = "💝";
  }

  let priceDisplay = "";
  let priceClass = "";
  if (product.onSale || product.suggestSale) {
    if (product.onSale && product.suggestSale) {
      priceClass = "text-purple-600";
    } else if (product.onSale) {
      priceClass = "text-red-500";
    } else {
      priceClass = "text-blue-500";
    }
    priceDisplay = `<span class="line-through text-gray-400">₩${product.originalVal.toLocaleString()}</span> <span class="${priceClass}">₩${product.val.toLocaleString()}</span>`;
  } else {
    priceDisplay = `₩${product.val.toLocaleString()}`;
  }

  return {
    titlePrefix,
    priceDisplay,
    priceClass,
    name: product.name,
    id: product.id,
    val: product.val,
    originalVal: product.originalVal,
  };
}

/**
 * 장바구니 아이템 HTML 템플릿 생성 (순수 함수)
 * @param {Object} itemData - 아이템 표시 데이터
 * @returns {string} HTML 템플릿
 */
function createCartItemHTML(itemData) {
  return `
    <div class="w-20 h-20 bg-gradient-black relative overflow-hidden">
      <div class="absolute top-1/2 left-1/2 w-[60%] h-[60%] bg-white/10 -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
    </div>
    <div>
      <h3 class="text-base font-normal mb-1 tracking-tight">${itemData.titlePrefix}${itemData.name}</h3>
      <p class="text-xs text-gray-500 mb-0.5 tracking-wide">PRODUCT</p>
      <p class="text-xs text-black mb-3">${itemData.priceDisplay}</p>
      <div class="flex items-center gap-4">
        <button class="quantity-change w-6 h-6 border border-black bg-white text-sm flex items-center justify-center transition-all hover:bg-black hover:text-white" data-product-id="${itemData.id}" data-change="-1">−</button>
        <span class="quantity-number text-sm font-normal min-w-[20px] text-center tabular-nums">1</span>
        <button class="quantity-change w-6 h-6 border border-black bg-white text-sm flex items-center justify-center transition-all hover:bg-black hover:text-white" data-product-id="${itemData.id}" data-change="1">+</button>
      </div>
    </div>
    <div class="text-right">
      <div class="text-lg mb-2 tracking-tight tabular-nums">${itemData.priceDisplay}</div>
      <a class="remove-item text-2xs text-gray-500 uppercase tracking-wider cursor-pointer transition-colors border-b border-transparent hover:text-black hover:border-black" data-product-id="${itemData.id}">Remove</a>
    </div>
  `;
}

/**
 * 장바구니 이벤트 타입 결정 (순수 함수)
 * @param {Event} event - 클릭 이벤트
 * @returns {Object} 이벤트 처리 정보
 */
function parseCartClickEvent(event) {
  const { target } = event;

  if (!target.classList.contains("quantity-change") && !target.classList.contains("remove-item")) {
    return { shouldHandle: false };
  }

  const { productId } = target.dataset;
  if (!productId) {
    return { shouldHandle: false };
  }

  if (target.classList.contains("quantity-change")) {
    return {
      shouldHandle: true,
      actionType: "QUANTITY_CHANGE",
      productId,
      quantityChange: parseInt(target.dataset.change, 10),
    };
  }

  if (target.classList.contains("remove-item")) {
    return {
      shouldHandle: true,
      actionType: "REMOVE_ITEM",
      productId,
    };
  }

  return { shouldHandle: false };
}

/**
 * 수량 변경 계산 (순수 함수)
 * @param {number} currentQuantity - 현재 수량
 * @param {number} quantityChange - 수량 변경값
 * @param {number} availableStock - 사용 가능한 재고
 * @returns {Object} 수량 변경 결과
 */
function calculateQuantityChange(currentQuantity, quantityChange, availableStock) {
  const newQuantity = currentQuantity + quantityChange;

  if (newQuantity > 0 && newQuantity <= availableStock + currentQuantity) {
    return {
      isValid: true,
      action: "UPDATE_QUANTITY",
      newQuantity,
      stockChange: -quantityChange,
    };
  }

  if (newQuantity <= 0) {
    return {
      isValid: true,
      action: "REMOVE_ITEM",
      stockChange: currentQuantity,
    };
  }

  return {
    isValid: false,
    reason: "INSUFFICIENT_STOCK",
    message: "재고가 부족합니다.",
  };
}

main();

// 이벤트 핸들러 등록 (useDOMManager에서 요소 가져오기)
const addToCartButton = useDOMManager.getElement("addToCartButton");
const productSelectElement = useDOMManager.getElement("productSelect");

addToCartButton.addEventListener("click", function () {
  const selItem = productSelectElement.value;
  const itemToAdd = useProductData.findProductById(selItem);

  // 입력 검증 (순수 함수 사용)
  const validation = validateAddToCartInput(selItem, itemToAdd);
  if (!validation.isValid) {
    return;
  }

  if (itemToAdd && itemToAdd.q > 0) {
    const item = document.getElementById(itemToAdd.id);
    if (item) {
      const qtyElem = item.querySelector(".quantity-number");
      const newQty = parseInt(qtyElem.textContent, 10) + 1;
      if (newQty <= itemToAdd.q + parseInt(qtyElem.textContent, 10)) {
        qtyElem.textContent = newQty;
        useProductData.updateProductStock(itemToAdd.id, -1);
      } else {
        alert("재고가 부족합니다.");
      }
    } else {
      const newItem = document.createElement("div");
      newItem.id = itemToAdd.id;
      newItem.className =
        "grid grid-cols-[80px_1fr_auto] gap-5 py-5 border-b border-gray-100 first:pt-0 last:border-b-0 last:pb-0";

      // 표시 데이터 계산 (순수 함수 사용)
      const itemDisplayData = calculateItemDisplayData(itemToAdd);

      // HTML 템플릿 생성 (순수 함수 사용)
      newItem.innerHTML = createCartItemHTML(itemDisplayData);

      // DOM 요소 가져오기 (useDOMManager 사용)
      const cartDisplayElement = useDOMManager.getElement("cartDisplay");
      cartDisplayElement.appendChild(newItem);
      useProductData.updateProductStock(itemToAdd.id, -1);
    }
    updateCartDisplay();

    // 상태 업데이트 (useDOMManager 사용)
    useDOMManager.setState("lastSelectedProductId", selItem);
  }
});

// cartDisplayElement 이벤트 핸들러 등록 (useDOMManager에서 요소 가져오기)
const cartDisplayElement = useDOMManager.getElement("cartDisplay");
cartDisplayElement.addEventListener("click", function (event) {
  // 이벤트 파싱 (순수 함수 사용)
  const eventInfo = parseCartClickEvent(event);
  if (!eventInfo.shouldHandle) return;

  const itemElem = document.getElementById(eventInfo.productId);
  const prod = useProductData.findProductById(eventInfo.productId);
  if (!prod || !itemElem) return;

  if (eventInfo.actionType === "QUANTITY_CHANGE") {
    const qtyElem = itemElem.querySelector(".quantity-number");
    const currentQty = parseInt(qtyElem.textContent, 10);

    // 수량 변경 계산 (순수 함수 사용)
    const changeResult = calculateQuantityChange(currentQty, eventInfo.quantityChange, prod.q);

    if (changeResult.isValid) {
      if (changeResult.action === "UPDATE_QUANTITY") {
        qtyElem.textContent = changeResult.newQuantity;
        useProductData.updateProductStock(prod.id, changeResult.stockChange);
      } else if (changeResult.action === "REMOVE_ITEM") {
        useProductData.updateProductStock(prod.id, changeResult.stockChange);
        itemElem.remove();
      }
    } else {
      alert(changeResult.message);
    }
  } else if (eventInfo.actionType === "REMOVE_ITEM") {
    const qtyElem = itemElem.querySelector(".quantity-number");
    const remQty = parseInt(qtyElem.textContent, 10);
    useProductData.updateProductStock(prod.id, remQty);
    itemElem.remove();
  }

  // 연관 업데이트
  updateCartDisplay();
  updateProductSelectOptions();
});
